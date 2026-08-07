const modulename = 'WebServer:HistorySearch';
import { DatabaseActionType } from '@modules/Database/databaseTypes';
import consoleFactory from '@lib/console';
import { AuthedCtx } from '@modules/WebServer/ctxTypes';
import { chain as createChain } from 'lodash-es';
import Fuse from 'fuse.js';
import { now } from '@lib/misc';
import { parseLaxIdsArrayInput } from '@lib/player/idUtils';
import { HistoryTableActionType, HistoryTableSearchResp } from '@shared/historyApiTypes';
import { TimeCounter } from '@modules/Metrics/statsUtils';
const console = consoleFactory(modulename);

//Helpers
const DEFAULT_LIMIT = 100; //cant override it for now
const ALLOWED_SORTINGS = ['timestamp'];


/**
 * Returns the players stats for the Players page table
 */
export default async function HistorySearch(ctx: AuthedCtx) {
    //Sanity check
    if (typeof ctx.query === 'undefined') {
        return ctx.utils.error(400, '无效请求');
    }
    const {
        searchValue,
        searchType,
        filterbyType,
        filterbyAdmin,
        sortingKey,
        sortingDesc,
        offsetParam,
        offsetActionId
    } = ctx.query;
    const sendTypedResp = (data: HistoryTableSearchResp) => ctx.send(data);
    const searchTime = new TimeCounter();
    const dbo = txCore.database.getDboRef();
    let chain = dbo.chain.get('actions').clone(); //shallow clone to avoid sorting the original

    //sort the actions by the sortingKey/sortingDesc
    const parsedSortingDesc = sortingDesc === 'true';
    if (typeof sortingKey !== 'string' || !ALLOWED_SORTINGS.includes(sortingKey)) {
        return sendTypedResp({ error: '无效的排序键' });
    }
    chain = chain.sort((a, b) => {
        // @ts-ignore
        return parsedSortingDesc ? b[sortingKey] - a[sortingKey] : a[sortingKey] - b[sortingKey];
    });

    //offset the actions by the offsetParam/offsetActionId
    if (offsetParam !== undefined && offsetActionId !== undefined) {
        const parsedOffsetParam = parseInt(offsetParam as string);
        if (isNaN(parsedOffsetParam) || typeof offsetActionId !== 'string' || !offsetActionId.length) {
            return sendTypedResp({ error: '无效的 offsetParam 或 offsetActionId' });
        }
        chain = chain.takeRightWhile((a) => {
            return a.id !== offsetActionId && parsedSortingDesc
                ? a[sortingKey as keyof DatabaseActionType] as number <= parsedOffsetParam
                : a[sortingKey as keyof DatabaseActionType] as number >= parsedOffsetParam
        });
    }

    //filter the actions by the simple filters (lightweight)
    const effectiveTypeFilter = typeof filterbyType === 'string' && filterbyType.length ? filterbyType : undefined;
    const effectiveAdminFilter = typeof filterbyAdmin === 'string' && filterbyAdmin.length ? filterbyAdmin : undefined;
    if (effectiveTypeFilter || effectiveAdminFilter) {
        chain = chain.filter((a) => {
            if (effectiveTypeFilter && a.type !== effectiveTypeFilter) {
                return false;
            }
            if (effectiveAdminFilter && a.author !== effectiveAdminFilter) {
                return false;
            }
            return true;
        });
    }

    // filter the actions by the searchValue/searchType (VERY HEAVY!)
    if (typeof searchType === 'string') {
        if (typeof searchValue !== 'string' || !searchValue.length) {
            return sendTypedResp({ error: '无效的搜索值（searchValue）' });
        }

        if (searchType === 'actionId') {
            //Searching by action ID
            const cleanId = searchValue.toUpperCase().trim();
            if (!cleanId.length) {
                return sendTypedResp({ error: '该操作 ID 无法搜索（为空？）。' });
            }
            const actions = chain.value();
            const fuse = new Fuse(actions, {
                isCaseSensitive: true, //maybe that's an optimization?!
                keys: ['id'],
                threshold: 0.3
            });
            const filtered = fuse.search(cleanId).map(x => x.item);
            chain = createChain(filtered);
        } else if (searchType === 'reason') {
            //Searching by player notes
            const actions = chain.value();
            const fuse = new Fuse(actions, {
                keys: ['reason'],
                threshold: 0.3
            });
            const filtered = fuse.search(searchValue).map(x => x.item);
            chain = createChain(filtered);
        } else if (searchType === 'identifiers') {
            //Searching by target identifiers
            const { validIds, validHwids, invalids } = parseLaxIdsArrayInput(searchValue);
            if (invalids.length) {
                return sendTypedResp({ error: `无效的标识符（${invalids.join(',')}）。任何标识符都需要带上类型前缀，例如使用 'fivem:123456' 而不是仅 '123456'。` });
            }
            if (!validIds.length && !validHwids.length) {
                return sendTypedResp({ error: `未找到有效的标识符。` });
            }
            chain = chain.filter((a) => {
                if (validIds.length && !validIds.some((id) => a.ids.includes(id))) {
                    return false;
                }
                if (validHwids.length && 'hwids' in a &&  !validHwids.some((hwid) => a.hwids!.includes(hwid))) {
                    return false;
                }
                return true;
            });
        } else {
            return sendTypedResp({ error: '未知的搜索类型（searchType）' });
        }
    }

    //filter players by the limit - taking 1 more to check if we reached the end
    chain = chain.take(DEFAULT_LIMIT + 1);
    const actions = chain.value();
    const hasReachedEnd = actions.length <= DEFAULT_LIMIT;
    const currTs = now();
    const processedActions = actions.slice(0, DEFAULT_LIMIT).map((a) => {
        let banExpiration, warnAcked;
        if (a.type === 'ban') {
            if (a.expiration === false) {
                banExpiration = 'permanent' as const;
            } else if (typeof a.expiration === 'number' && a.expiration < currTs) {
                banExpiration = 'expired' as const;
            } else {
                banExpiration = 'active' as const;
            }
        } else if (a.type === 'warn') {
            warnAcked = a.acked;
        }
        return {
            id: a.id,
            type: a.type,
            playerName: a.playerName,
            author: a.author,
            reason: a.reason,
            timestamp: a.timestamp,
            isRevoked: !!a.revocation.timestamp,
            banExpiration,
            warnAcked,
        } satisfies HistoryTableActionType;
    });

    txCore.metrics.txRuntime.historyTableSearchTime.count(searchTime.stop().milliseconds);
    return sendTypedResp({
        history: processedActions,
        hasReachedEnd,
    });
};
