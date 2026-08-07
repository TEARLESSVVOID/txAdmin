import InlineCode from "@/components/InlineCode";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { ApiOauthCallbackErrorResp } from "@shared/authApiTypes";
import { ArrowLeftIcon } from "lucide-react";
import { Link } from "wouter";


//Shortcut component
function ErrorText({ children }: { children: React.ReactNode }) {
    return (
        <p className="whitespace-pre-wrap text-secondary-foreground leading-relaxed pb-2">
            {children}
        </p>
    );
};

export type AuthErrorData = ApiOauthCallbackErrorResp & { returnTo?: string };
type AuthErrorProps = {
    error: AuthErrorData;
};


/**
 * Display OAuth errors in a user-friendly way.
 */
export function AuthError({ error }: AuthErrorProps) {
    error.returnTo = error.returnTo ?? '/login';
    let titleNode: React.ReactNode = null;
    let bodyNode: React.ReactNode = null;
    if ('errorTitle' in error) {
        titleNode = error.errorTitle
        bodyNode = <ErrorText>{error.errorMessage}</ErrorText>;
    } else if (error.errorCode === 'invalid_session') {
        titleNode = '浏览器会话无效。';
        bodyNode = <ErrorText>
            您可能在进入此页面之前刚刚重启了 txAdmin。 <br />
            请返回后重试。
        </ErrorText>
    } else if (error.errorCode === 'clock_desync') {
        titleNode = '请更新/同步您的 VPS 时钟。';
        bodyNode = <ErrorText>
            登录失败，因为此主机的时间不正确。请确保与互联网时间同步。
        </ErrorText>
    } else if (error.errorCode === 'timeout') {
        titleNode = '连接 FiveM 服务器超时。';
        bodyNode = <ErrorText>
            请重试，或使用现有的用户名和备用密码登录。
        </ErrorText>
    } else if (error.errorCode === 'end_user_aborted') {
        titleNode = '登录已中止';
        bodyNode = <ErrorText>
            Cfx.re 登录流程已中止。 <br />
            返回登录页面重试。
        </ErrorText>
    } else if (error.errorCode === 'end_user_logout') {
        titleNode = '登录已中止';
        bodyNode = <ErrorText>
            由于您已退出 Cfx.re 账户，Cfx.re 登录流程被中止。 <br />
            返回登录页面重试。
        </ErrorText>
    } else if (error.errorCode === 'master_already_set') {
        titleNode = '主管理员账户已设置';
        bodyNode = <ErrorText>
            请返回登录页面继续。 <br />
        </ErrorText>
    } else if (error.errorCode === 'not_admin') {
        const fivemId = error.errorContext?.identifier ?? '未知';
        const fivemName = error.errorContext?.name ?? '未知';
        titleNode = `Cfx.re 账户“${fivemName}”不是管理员。`;
        bodyNode = <ErrorText>
            上述标识符为 <InlineCode>{fivemId}</InlineCode> 的账户未关联到 txAdmin 中注册的任何账户。 <br />
            您也可以尝试使用用户名和备用密码登录。
        </ErrorText>
    } else {
        titleNode = '未知错误：';
        bodyNode = <div className="text-left rounded-sm text-muted-foreground bg-muted p-1">
            <pre className="text-left whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
    }

    return (
        <div className="p-4">
            <h3 className="text-2xl font-bold text-destructive-inline mb-4">
                {titleNode}
            </h3>
            {bodyNode}
            <CardFooter className="w-full flex justify-center mt-4 pb-0">
                <Link href={error.returnTo} asChild>
                    <Button className="x">
                        <ArrowLeftIcon className="inline mr-2 h-4 w-4" />
                        重试
                    </Button>
                </Link>
            </CardFooter>
        </div>
    )
}


/**
 * Check the URL search params for common OAuth errors and return them.
 */
export const checkCommonOauthErrors = () => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error');
    const errorDescription = params.get('error_description');
    if (errorCode === 'access_denied' && errorDescription === 'End-User aborted interaction') {
        return { errorCode: 'end_user_aborted' };
    } else if (errorCode === 'access_denied' && errorDescription === 'End-User aborted interaction (logout)') {
        return { errorCode: 'end_user_logout' };
    }
}


/**
 * Process fetch errors and return a common error object.
 */
export const processFetchError = (error: any) => {
    if (error.message?.startsWith('NetworkError')) {
        return {
            errorTitle: '网络错误',
            errorMessage: '如果您关闭了 txAdmin，请重新启动后再试。',
        };
    } else if(error.message?.startsWith('AbortSignal.timeout')) {
        return {
            errorTitle: '浏览器版本过旧',
            errorMessage: '此浏览器版本过旧，无法使用 txAdmin。请下载新版 Edge、Chrome、Firefox 等浏览器后重试。',
        };
    } else {
        return {
            errorTitle: '未知错误',
            errorMessage: error.message ?? '😵',
        };
    }
}
