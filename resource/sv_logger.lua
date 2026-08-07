-- Prevent running in monitor mode
if not TX_SERVER_MODE then return end


-- =============================================
--  Logger
-- =============================================

-- Micro optimization & variables
local sub = string.sub
local ostime = os.time
local tonumber = tonumber
local loggerBuffer = {}


--- function logger
--- Sends logs through fd3 to the server & displays the logs on the panel.
---@param src number the source of the player who did the action, or 'tx' if internal
---@param type string the action type
---@param data table|nil the event data
local function logger(src, type, data)
    loggerBuffer[#loggerBuffer+1] = {
        src = src,
        type = type,
        data = data or false
    }
end


-- send all of the buffered logs every second
CreateThread(function()
    while true do
        Wait(1000)
        if #loggerBuffer > 0 then
            -- Adding timestamp with fake ms to log entries
            local ts = ostime() * 1000
            for i = 1, #loggerBuffer do
                if i <= 999 then
                    loggerBuffer[i].ts = ts + i-1
                else
                    loggerBuffer[i].ts = ts + 999
                end
            end

            --Sending logs via FD3 and resetting buffer
            local payload = json.encode({
                type = 'txAdminLogData',
                logs = loggerBuffer
            })
            PrintStructuredTrace(payload)
            loggerBuffer = {}
        end
    end
end)

--Send initial data
CreateThread(function()
    local resList = {}
    local resCount = GetNumResources() - 1
    for i = 0, resCount do
        local resName = GetResourceByFindIndex(i)
        if GetResourceState(resName) == 'started' then
            local resVersion = GetResourceMetadata(resName, 'version')
            if type(resVersion) == 'string' and #resVersion > 0 then
                resList[#resList+1] = resName..'/'..resVersion
            else
                resList[#resList+1] = resName
            end
        end
    end

    logger('tx', 'LoggerStarted', {
        --txAdmin.metrics.playerDrops data
        gameName = GetConvar('gamename', 'gta5'),
        gameBuild = GetConvar('sv_enforceGameBuild', 'invalid'),
        fxsVersion = GetConvar('version', 'invalid'),
        resources = resList,
    })
end)


-- Explosion handler
local function isInvalid(property, invalidType)
    return (property == nil or property == invalidType)
end

local explosionTypes = {'GRENADE', 'GRENADELAUNCHER', 'STICKYBOMB', 'MOLOTOV', 'ROCKET', 'TANKSHELL', 'HI_OCTANE', 'CAR', 'PLANE', 'PETROL_PUMP', 'BIKE', 'DIR_STEAM', 'DIR_FLAME', 'DIR_WATER_HYDRANT', 'DIR_GAS_CANISTER', 'BOAT', 'SHIP_DESTROY', 'TRUCK', 'BULLET', 'SMOKEGRENADELAUNCHER', 'SMOKEGRENADE', 'BZGAS', 'FLARE', 'GAS_CANISTER', 'EXTINGUISHER', 'PROGRAMMABLEAR', 'TRAIN', 'BARREL', 'PROPANE', 'BLIMP', 'DIR_FLAME_EXPLODE', 'TANKER', 'PLANE_ROCKET', 'VEHICLE_BULLET', 'GAS_TANK', 'BIRD_CRAP', 'RAILGUN', 'BLIMP2', 'FIREWORK', 'SNOWBALL', 'PROXMINE', 'VALKYRIE_CANNON', 'AIR_DEFENCE', 'PIPEBOMB', 'VEHICLEMINE', 'EXPLOSIVEAMMO', 'APCSHELL', 'BOMB_CLUSTER', 'BOMB_GAS', 'BOMB_INCENDIARY', 'BOMB_STANDARD', 'TORPEDO', 'TORPEDO_UNDERWATER', 'BOMBUSHKA_CANNON', 'BOMB_CLUSTER_SECONDARY', 'HUNTER_BARRAGE', 'HUNTER_CANNON', 'ROGUE_CANNON', 'MINE_UNDERWATER', 'ORBITAL_CANNON', 'BOMB_STANDARD_WIDE', 'EXPLOSIVEAMMO_SHOTGUN', 'OPPRESSOR2_CANNON', 'MORTAR_KINETIC', 'VEHICLEMINE_KINETIC', 'VEHICLEMINE_EMP', 'VEHICLEMINE_SPIKE', 'VEHICLEMINE_SLICK', 'VEHICLEMINE_TAR', 'SCRIPT_DRONE', 'RAYGUN', 'BURIEDMINE', 'SCRIPT_MISSIL'}

AddEventHandler('explosionEvent', function(source, ev)
    if (isInvalid(ev.damageScale, 0) or isInvalid(ev.cameraShake, 0) or isInvalid(ev.isInvisible, true) or
        isInvalid(ev.isAudible, false)) then
        return
    end

    if ev.explosionType < -1 or ev.explosionType > 77 then
        ev.explosionType = '未知'
    else
        ev.explosionType = explosionTypes[ev.explosionType + 1]
    end

    logger(tonumber(source), 'explosionEvent', ev)
end)


-- An internal server handler, this is NOT exposed to the client
local function getLogPlayerName(src)
    if type(src) == 'number' then 
        local name = sub(GetPlayerName(src) or "未知", 1, 75)
        return '[#'..src..'] '..name
    else
        return '[??] '.. (src or "未知")
    end
end

AddEventHandler('txsv:logger:menuEvent', function(source, action, allowed, data)
    if not allowed then return end
    local message

    --SELF menu options
    if action == 'playerModeChanged' then
        if data == 'godmode' then
            message = "开启了无敌模式"
        elseif data == 'noclip' then
            message = "开启了穿墙（幽灵模式）"
        elseif data == 'superjump' then
            message = "开启了超级跳跃"
        elseif data == 'none' then
            message = "恢复为普通模式（标准模式）"
        else
            message = "将玩家模式更改为未知"
        end

    elseif action == 'teleportWaypoint' then
        message = "传送到了路点"

    elseif action == 'teleportCoords' then
        if type(data) ~= 'table' then return end
        local x = data.x
        local y = data.y
        local z = data.z
        message = ("传送到坐标 (x=%.3f, y=%0.3f, z=%0.3f)"):format(x or 0.0, y or 0.0, z or 0.0)

    elseif action == 'spawnVehicle' then
        if type(data) ~= 'string' then return end
        message = "生成了一辆载具 (模型: " .. data .. ")"

    elseif action == 'deleteVehicle' then
        message = "删除了一辆载具"

    elseif action == 'vehicleRepair' then
        message = "修理了自己的载具"

    elseif action == 'vehicleBoost' then
        message = "给自己的载具加速了"

    elseif action == 'healSelf' then
        message = "治愈了自己"

    elseif action == 'healAll' then
        message = "治愈了所有玩家！"

    elseif action == 'announcement' then
        if type(data) ~= 'string' then return end
        message = "发布了一条全服公告: " .. data

    elseif action == 'clearArea' then
        if type(data) ~= 'number' then return end
        message = "清理了半径为 ".. data .." 米的区域"

    --INTERACTION modal options
    elseif action == 'spectatePlayer' then
        message = '开始观察玩家 ' .. getLogPlayerName(data)

    elseif action == 'freezePlayer' then
        message = '切换了玩家 ' .. getLogPlayerName(data) .. ' 的冻结状态'

    elseif action == 'teleportPlayer' then
        if type(data) ~= 'table' then return end
        local playerName = getLogPlayerName(data.target)
        local x = data.x or 0.0
        local y = data.y or 0.0
        local z = data.z or 0.0
        message = ("传送到玩家 %s 的位置 (x=%.3f, y=%.3f, z=%.3f)"):format(playerName, x, y, z)

    elseif action == 'healPlayer' then
        message = "治愈了玩家 " .. getLogPlayerName(data)

    elseif action == 'summonPlayer' then
        message = "召唤了玩家 " .. getLogPlayerName(data)

    --TROLL modal options
    elseif action == 'drunkEffect' then
        message = "对 " .. getLogPlayerName(data) .. " 施加了醉酒效果"

    elseif action == 'setOnFire' then
        message = "使 ".. getLogPlayerName(data) .." 着火" 

    elseif action == 'wildAttack' then
        message = "对 " .. getLogPlayerName(data) .. " 发起了野兽袭击"

    elseif action == 'showPlayerIDs' then
        if type(data) ~= 'boolean' then return end
        if data then
            message = "开启了玩家 ID 显示"
        else
            message = "关闭了玩家 ID 显示"
        end

    --In case of unknown event
    else
        logger(source, 'DebugMessage', "未知菜单事件 "..action)
        return
    end

    logger(source, 'MenuEvent', {
        action = action,
        message = message
    })
end)

-- Extra handlers
RegisterNetEvent('txsv:logger:deathEvent', function(killer, cause)
    local logData = {
        cause = cause,
        killer = killer
    }
    logger(source, 'DeathNotice', logData)
end)

--FIXME: deprecate or allow server commands
--FIXME: didn't migrate to keep compatibility with external calls
RegisterNetEvent('txaLogger:CommandExecuted', function(data)
    logger(source, 'CommandExecuted', data)
end)

--FIXME: didn't migrate to keep compatibility with external calls
RegisterNetEvent('txaLogger:DebugMessage', function(data)
    logger(source, 'DebugMessage', data)
end)

local function logChatMessage(src, author, text)
    local logData = {
        author = author,
        text = text
    }
    logger(src, 'ChatMessage', logData)
end
RegisterNetEvent('chatMessage', logChatMessage)
AddEventHandler('txsv:logger:addChatMessage', logChatMessage)
