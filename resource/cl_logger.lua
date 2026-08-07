-- Death reasons
-- https://docs.fivem.net/docs/game-references/weapon-models/
local fivemDeathHashTable = {
    [GetHashKey('WEAPON_ANIMAL')] = '动物',
    [GetHashKey('WEAPON_COUGAR')] = '美洲狮',
    [GetHashKey('WEAPON_ADVANCEDRIFLE')] = '先进步枪',
    [GetHashKey('WEAPON_APPISTOL')] = 'AP 手枪',
    [GetHashKey('WEAPON_ASSAULTRIFLE')] = '突击步枪',
    [GetHashKey('WEAPON_ASSAULTRIFLE_MK2')] = '突击步枪 Mk2',
    [GetHashKey('WEAPON_ASSAULTSHOTGUN')] = '突击霰弹枪',
    [GetHashKey('WEAPON_ASSAULTSMG')] = '突击冲锋枪',
    [GetHashKey('WEAPON_AUTOSHOTGUN')] = '清道夫霰弹枪',
    [GetHashKey('WEAPON_BULLPUPRIFLE')] = '无托步枪',
    [GetHashKey('WEAPON_BULLPUPRIFLE_MK2')] = '无托步枪 Mk2',
    [GetHashKey('WEAPON_BULLPUPSHOTGUN')] = '无托霰弹枪',
    [GetHashKey('WEAPON_CARBINERIFLE')] = '卡宾步枪',
    [GetHashKey('WEAPON_CARBINERIFLE_MK2')] = '卡宾步枪 Mk2',
    [GetHashKey('WEAPON_COMBATMG')] = '战斗机枪',
    [GetHashKey('WEAPON_COMBATMG_MK2')] = '战斗机枪 Mk2',
    [GetHashKey('WEAPON_COMBATPDW')] = '战斗个人防卫武器',
    [GetHashKey('WEAPON_COMBATPISTOL')] = '战斗手枪',
    [GetHashKey('WEAPON_COMPACTRIFLE')] = '紧凑型步枪',
    [GetHashKey('WEAPON_DBSHOTGUN')] = '双管霰弹枪',
    [GetHashKey('WEAPON_DOUBLEACTION')] = '双动左轮手枪',
    [GetHashKey('WEAPON_GUSENBERG')] = '古森伯格扫射者',
    [GetHashKey('WEAPON_HEAVYPISTOL')] = '重型手枪',
    [GetHashKey('WEAPON_HEAVYSHOTGUN')] = '重型霰弹枪',
    [GetHashKey('WEAPON_HEAVYSNIPER')] = '重型狙击枪',
    [GetHashKey('WEAPON_HEAVYSNIPER_MK2')] = '重型狙击枪',
    [GetHashKey('WEAPON_MACHINEPISTOL')] = '冲锋手枪',
    [GetHashKey('WEAPON_MARKSMANPISTOL')] = '神射手手枪',
    [GetHashKey('WEAPON_MARKSMANRIFLE')] = '神射手步枪',
    [GetHashKey('WEAPON_MARKSMANRIFLE_MK2')] = '神射手步枪 Mk2',
    [GetHashKey('WEAPON_MG')] = '机枪',
    [GetHashKey('WEAPON_MICROSMG')] = '微型冲锋枪',
    [GetHashKey('WEAPON_MINIGUN')] = '迷你机枪',
    [GetHashKey('WEAPON_MINISMG')] = '小型冲锋枪',
    [GetHashKey('WEAPON_MUSKET')] = '火枪',
    [GetHashKey('WEAPON_PISTOL')] = '手枪',
    [GetHashKey('WEAPON_PISTOL_MK2')] = '手枪 Mk2',
    [GetHashKey('WEAPON_PISTOL50')] = '点50手枪',
    [GetHashKey('WEAPON_PUMPSHOTGUN')] = '泵动霰弹枪',
    [GetHashKey('WEAPON_PUMPSHOTGUN_MK2')] = '泵动霰弹枪 Mk2',
    [GetHashKey('WEAPON_RAILGUN')] = '电磁炮',
    [GetHashKey('WEAPON_REVOLVER')] = '左轮手枪',
    [GetHashKey('WEAPON_REVOLVER_MK2')] = '左轮手枪 Mk2',
    [GetHashKey('WEAPON_SAWNOFFSHOTGUN')] = '锯短霰弹枪',
    [GetHashKey('WEAPON_SMG')] = '冲锋枪',
    [GetHashKey('WEAPON_SMG_MK2')] = '冲锋枪 Mk2',
    [GetHashKey('WEAPON_SNIPERRIFLE')] = '狙击步枪',
    [GetHashKey('WEAPON_SNSPISTOL')] = 'SNS 手枪',
    [GetHashKey('WEAPON_SNSPISTOL_MK2')] = 'SNS 手枪 Mk2',
    [GetHashKey('WEAPON_SPECIALCARBINE')] = '特制卡宾枪',
    [GetHashKey('WEAPON_SPECIALCARBINE_MK2')] = '特制卡宾枪 Mk2',
    [GetHashKey('WEAPON_STINGER')] = '毒刺',
    [GetHashKey('WEAPON_STUNGUN')] = '电击枪',
    [GetHashKey('WEAPON_VINTAGEPISTOL')] = '复古手枪',
    [GetHashKey('VEHICLE_WEAPON_PLAYER_LASER')] = '载具激光',
    [GetHashKey('WEAPON_FIRE')] = '火焰',
    [GetHashKey('WEAPON_FLARE')] = '照明弹',
    [GetHashKey('WEAPON_FLAREGUN')] = '信号枪',
    [GetHashKey('WEAPON_MOLOTOV')] = '燃烧瓶',
    [GetHashKey('WEAPON_PETROLCAN')] = '汽油桶',
    [GetHashKey('WEAPON_HELI_CRASH')] = '直升机坠毁',
    [GetHashKey('WEAPON_RAMMED_BY_CAR')] = '被载具撞击',
    [GetHashKey('WEAPON_RUN_OVER_BY_CAR')] = '被载具碾压',
    [GetHashKey('VEHICLE_WEAPON_SPACE_ROCKET')] = '载具太空火箭',
    [GetHashKey('VEHICLE_WEAPON_TANK')] = '坦克',
    [GetHashKey('WEAPON_AIRSTRIKE_ROCKET')] = '空袭火箭',
    [GetHashKey('WEAPON_AIR_DEFENCE_GUN')] = '防空炮',
    [GetHashKey('WEAPON_COMPACTLAUNCHER')] = '紧凑型发射器',
    [GetHashKey('WEAPON_EXPLOSION')] = '爆炸',
    [GetHashKey('WEAPON_FIREWORK')] = '烟花',
    [GetHashKey('WEAPON_GRENADE')] = '手榴弹',
    [GetHashKey('WEAPON_GRENADELAUNCHER')] = '榴弹发射器',
    [GetHashKey('WEAPON_HOMINGLAUNCHER')] = '追踪导弹发射器',
    [GetHashKey('WEAPON_PASSENGER_ROCKET')] = '乘客火箭',
    [GetHashKey('WEAPON_PIPEBOMB')] = '管状炸弹',
    [GetHashKey('WEAPON_PROXMINE')] = '感应地雷',
    [GetHashKey('WEAPON_RPG')] = 'RPG 火箭筒',
    [GetHashKey('WEAPON_STICKYBOMB')] = '黏性炸弹',
    [GetHashKey('WEAPON_VEHICLE_ROCKET')] = '载具火箭',
    [GetHashKey('WEAPON_BZGAS')] = 'BZ 毒气',
    [GetHashKey('WEAPON_FIREEXTINGUISHER')] = '灭火器',
    [GetHashKey('WEAPON_SMOKEGRENADE')] = '催泪瓦斯',
    [GetHashKey('WEAPON_BATTLEAXE')] = '战斧',
    [GetHashKey('WEAPON_BOTTLE')] = '酒瓶',
    [GetHashKey('WEAPON_KNIFE')] = '小刀',
    [GetHashKey('WEAPON_MACHETE')] = '砍刀',
    [GetHashKey('WEAPON_SWITCHBLADE')] = '弹簧刀',
    [GetHashKey('OBJECT')] = '物体',
    [GetHashKey('VEHICLE_WEAPON_ROTORS')] = '载具旋翼',
    [GetHashKey('WEAPON_BALL')] = '球',
    [GetHashKey('WEAPON_BAT')] = '棒球棍',
    [GetHashKey('WEAPON_CROWBAR')] = '撬棍',
    [GetHashKey('WEAPON_FLASHLIGHT')] = '手电筒',
    [GetHashKey('WEAPON_GOLFCLUB')] = '高尔夫球杆',
    [GetHashKey('WEAPON_HAMMER')] = '锤子',
    [GetHashKey('WEAPON_HATCHET')] = '短柄斧',
    [GetHashKey('WEAPON_HIT_BY_WATER_CANNON')] = '水炮',
    [GetHashKey('WEAPON_KNUCKLE')] = '指虎',
    [GetHashKey('WEAPON_NIGHTSTICK')] = '警棍',
    [GetHashKey('WEAPON_POOLCUE')] = '台球杆',
    [GetHashKey('WEAPON_SNOWBALL')] = '雪球',
    [GetHashKey('WEAPON_UNARMED')] = '拳头',
    [GetHashKey('WEAPON_WRENCH')] = '管钳',
    [GetHashKey('WEAPON_DROWNING')] = '溺水',
    [GetHashKey('WEAPON_DROWNING_IN_VEHICLE')] = '在载具中溺水',
    [GetHashKey('WEAPON_BARBED_WIRE')] = '带刺铁丝网',
    [GetHashKey('WEAPON_BLEEDING')] = '失血',
    [GetHashKey('WEAPON_ELECTRIC_FENCE')] = '电网',
    [GetHashKey('WEAPON_EXHAUSTION')] = '力竭',
    [GetHashKey('WEAPON_FALL')] = '坠落',
    [GetHashKey('WEAPON_RAYPISTOL')] = '跃迁原子化枪',
    [GetHashKey('WEAPON_RAYCARBINE')] = '恶魔地狱使者',
    [GetHashKey('WEAPON_RAYMINIGUN')] = '寡妇制造者',
    [GetHashKey('WEAPON_STONE_HATCHET')] = '石斧',
    [GetHashKey('WEAPON_DAGGER')] = '古董骑兵匕首', -- MPHIPSTER
    -- MPHEIST3 DLC (v 1868)
    [GetHashKey('WEAPON_CERAMICPISTOL')] = '陶瓷手枪',
    [GetHashKey('WEAPON_NAVYREVOLVER')] = '海军左轮手枪',
    [GetHashKey('WEAPON_HAZARDCAN')] = '危险汽油桶',
    -- MPHEIST4 DLC (v 2189)
    [GetHashKey('WEAPON_GADGETPISTOL')] = '佩里科手枪',
    [GetHashKey('WEAPON_MILITARYRIFLE')] = '军用步枪',
    [GetHashKey('WEAPON_COMBATSHOTGUN')] = '战斗霰弹枪',
    -- MPSECURITY DLC (v 2545)
    [GetHashKey('WEAPON_EMPLAUNCHER')] = 'EMP 发射器',
    [GetHashKey('WEAPON_HEAVYRIFLE')] = '重型步枪',
    [GetHashKey('WEAPON_FERTILIZERCAN')] = '化肥桶',
    [GetHashKey('WEAPON_STUNGUN_MP')] = '电击枪 MP',
    -- MPSUM2 DLC (V 2699)
    [GetHashKey('WEAPON_TACTICALRIFLE')] = '战术步枪',
    [GetHashKey('WEAPON_PRECISIONRIFLE')] = '精密步枪',
    -- MPCHRISTMAS3 DLC (V 2802)
    [GetHashKey('WEAPON_PISTOLXM3')] = 'WM 29 手枪',
    [GetHashKey('WEAPON_CANDYCANE')] = '拐杖糖',
    [GetHashKey('WEAPON_RAILGUNXM3')] = '电磁炮 XM3',
    [GetHashKey('WEAPON_ACIDPACKAGE')] = '酸性包裹',
    -- MP2023_01 DLC (V 2944)
    [GetHashKey('WEAPON_TECPISTOL')] = '战术冲锋枪',
    -- MP2023_02 DLC (V 3095)
    [GetHashKey('WEAPON_BATTLERIFLE')] = '战斗步枪',
    [GetHashKey('WEAPON_SNOWLAUNCHER')] = '雪球发射器',
    [GetHashKey('WEAPON_HACKINGDEVICE')] = '黑客装置',
    -- MP2024_01 DLC (V 3258)
    [GetHashKey('weapon_stunrod')] = '电击棒',
}

-- https://github.com/femga/rdr3_discoveries/blob/master/weapons/weapons.lua
local redmDeathHashTable = {
    [GetHashKey('WEAPON_MELEE_HATCHET_MELEEONLY')] = '近战短柄斧（仅近战）',
    [GetHashKey('WEAPON_MELEE_KNIFE_MINER')] = '矿工刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_JAWBONE')] = '颚骨刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_VAMPIRE')] = '吸血鬼刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_JOHN')] = '约翰的刀',
    [GetHashKey('WEAPON_MELEE_MACHETE')] = '砍刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_BEAR')] = '熊刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_DUTCH')] = '达奇的刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_KIERAN')] = '基兰的刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_UNCLE')] = '安克的刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_SEAN')] = '肖恩的刀',
    [GetHashKey('WEAPON_MELEE_TORCH')] = '火把',
    [GetHashKey('WEAPON_MELEE_KNIFE_LENNY')] = '莱尼的刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_SADIE')] = '萨迪的刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_CHARLES')] = '查尔斯的刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_HOSEA')] = '霍西亚的刀',
    [GetHashKey('WEAPON_MELEE_TORCH_CROWD')] = '火把（人群）',
    [GetHashKey('WEAPON_MELEE_KNIFE_BILL')] = '比尔的刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_CIVIL_WAR')] = '内战刀',
    [GetHashKey('WEAPON_MELEE_KNIFE')] = '小刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_MICAH')] = '迈卡的刀',
    [GetHashKey('WEAPON_MELEE_BROKEN_SWORD')] = '断剑',
    [GetHashKey('WEAPON_MELEE_KNIFE_JAVIER')] = '哈维尔的刀',
    [GetHashKey('WEAPON_PISTOL_VOLCANIC')] = '火山手枪',
    [GetHashKey('WEAPON_PISTOL_MAUSER_DRUNK')] = '醉酒毛瑟手枪',
    [GetHashKey('WEAPON_PISTOL_M1899')] = 'M1899 手枪',
    [GetHashKey('WEAPON_PISTOL_SEMIAUTO')] = '半自动手枪',
    [GetHashKey('WEAPON_PISTOL_MAUSER')] = '毛瑟手枪',
    [GetHashKey('WEAPON_REPEATER_EVANS')] = '埃文斯连发步枪',
    [GetHashKey('WEAPON_REPEATER_CARBINE_SADIE')] = '萨迪的卡宾连发枪',
    [GetHashKey('WEAPON_REPEATER_HENRY')] = '亨利连发步枪',
    [GetHashKey('WEAPON_REPEATER_WINCHESTER')] = '温彻斯特连发步枪',
    [GetHashKey('WEAPON_REPEATER_WINCHESTER_JOHN')] = '约翰的温彻斯特连发步枪',
    [GetHashKey('WEAPON_REPEATER_CARBINE')] = '卡宾连发枪',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_MICAH_DUALWIELD')] = '双动左轮（迈卡双持）',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_MICAH')] = '双动左轮（迈卡）',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_CALLOWAY')] = '斯科菲尔德左轮（卡洛维）',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION')] = '双动左轮',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN')] = '牧人左轮',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_MEXICAN')] = '墨西哥牧人左轮',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_HOSEA_DUALWIELD')] = '牧人左轮（霍西亚双持）',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_EXOTIC')] = '异域双动左轮',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_SEAN')] = '牧人左轮（肖恩）',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_SADIE')] = '牧人左轮（萨迪）',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_JAVIER')] = '双动左轮（哈维尔）',
    [GetHashKey('WEAPON_REVOLVER_LEMAT')] = '勒马特左轮',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_BILL')] = '斯科菲尔德左轮（比尔）',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD')] = '斯科菲尔德左轮',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_SADIE_DUALWIELD')] = '牧人左轮（萨迪双持）',
    [GetHashKey('WEAPON_REVOLVER_DOUBLEACTION_GAMBLER')] = '赌徒双动左轮',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_KIERAN')] = '牧人左轮（基兰）',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_UNCLE')] = '斯科菲尔德左轮（安克）',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_HOSEA')] = '牧人左轮（霍西亚）',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_LENNY')] = '牧人左轮（莱尼）',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_JOHN')] = '牧人左轮（约翰）',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_DUTCH_DUALWIELD')] = '斯科菲尔德左轮（达奇双持）',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_GOLDEN')] = '金色斯科菲尔德左轮',
    [GetHashKey('WEAPON_REVOLVER_CATTLEMAN_PIG')] = '牧人左轮（皮格）',
    [GetHashKey('WEAPON_REVOLVER_SCHOFIELD_DUTCH')] = '斯科菲尔德左轮（达奇）',
    [GetHashKey('WEAPON_RIFLE_SPRINGFIELD')] = '斯普林菲尔德步枪',
    [GetHashKey('WEAPON_RIFLE_BOLTACTION')] = '栓动步枪',
    [GetHashKey('WEAPON_RIFLE_BOLTACTION_BILL')] = '栓动步枪（比尔）',
    [GetHashKey('WEAPON_RIFLE_VARMINT')] = '害虫步枪',
    [GetHashKey('WEAPON_SHOTGUN_SAWEDOFF')] = '锯短霰弹枪',
    [GetHashKey('WEAPON_SHOTGUN_DOUBLEBARREL_EXOTIC')] = '异域双管霰弹枪',
    [GetHashKey('WEAPON_SHOTGUN_PUMP')] = '泵动霰弹枪',
    [GetHashKey('WEAPON_SHOTGUN_REPEATING')] = '连发霰弹枪',
    [GetHashKey('WEAPON_SHOTGUN_SEMIAUTO')] = '半自动霰弹枪',
    [GetHashKey('WEAPON_SHOTGUN_DOUBLEBARREL')] = '双管霰弹枪',
    [GetHashKey('WEAPON_SHOTGUN_DOUBLEBARREL_UNCLE')] = '双管霰弹枪（安克）',
    [GetHashKey('WEAPON_SHOTGUN_SAWEDOFF_CHARLES')] = '锯短霰弹枪（查尔斯）',
    [GetHashKey('WEAPON_SHOTGUN_SEMIAUTO_HOSEA')] = '半自动霰弹枪（霍西亚）',
    [GetHashKey('WEAPON_SNIPERRIFLE_ROLLINGBLOCK_LENNY')] = '滚块狙击枪（莱尼）',
    [GetHashKey('WEAPON_SNIPERRIFLE_ROLLINGBLOCK_EXOTIC')] = '异域滚块狙击枪',
    [GetHashKey('WEAPON_SNIPERRIFLE_CARCANO')] = '卡尔卡诺狙击枪',
    [GetHashKey('WEAPON_SNIPERRIFLE_ROLLINGBLOCK')] = '滚块狙击枪',
    [GetHashKey('WEAPON_MELEE_HATCHET')] = '短柄斧',
    [GetHashKey('WEAPON_MELEE_HATCHET_HEWING')] = '劈木斧',
    [GetHashKey('WEAPON_MELEE_ANCIENT_HATCHET')] = '古代短柄斧',
    [GetHashKey('WEAPON_MELEE_HATCHET_HUNTER')] = '猎斧',
    [GetHashKey('WEAPON_THROWN_THROWING_KNIVES_JAVIER')] = '哈维尔的投掷飞刀',
    [GetHashKey('WEAPON_THROWN_MOLOTOV')] = '投掷燃烧瓶',
    [GetHashKey('WEAPON_MELEE_HATCHET_VIKING')] = '维京短柄斧',
    [GetHashKey('WEAPON_THROWN_TOMAHAWK_ANCIENT')] = '古代投掷战斧',
    [GetHashKey('WEAPON_MELEE_HATCHET_DOUBLE_BIT_RUSTED')] = '生锈双刃斧',
    [GetHashKey('WEAPON_THROWN_TOMAHAWK')] = '投掷战斧',
    [GetHashKey('WEAPON_THROWN_DYNAMITE')] = '投掷炸药',
    [GetHashKey('WEAPON_MELEE_HATCHET_DOUBLE_BIT')] = '双刃斧',
    [GetHashKey('WEAPON_THROWN_THROWING_KNIVES')] = '投掷飞刀',
    [GetHashKey('WEAPON_MELEE_HATCHET_HUNTER_RUSTED')] = '生锈猎斧',
    [GetHashKey('WEAPON_MELEE_CLEAVER')] = '斩肉刀',
    [GetHashKey('WEAPON_MELEE_LANTERN')] = '提灯',
    [GetHashKey('WEAPON_MELEE_DAVY_LANTERN')] = '戴维提灯',
    [GetHashKey('WEAPON_MELEE_LANTERN_ELECTRIC')] = '电提灯',
    [GetHashKey('WEAPON_KIT_BINOCULARS')] = '望远镜',
    [GetHashKey('WEAPON_KIT_CAMERA')] = '相机',
    [GetHashKey('WEAPON_KIT_DETECTOR')] = '探测器',
    [GetHashKey('WEAPON_BOW_CHARLES')] = '查尔斯的弓',
    [GetHashKey('WEAPON_BOW')] = '弓',
    [GetHashKey('WEAPON_FISHINGROD')] = '钓鱼竿',
    [GetHashKey('WEAPON_LASSO')] = '套索',
    [GetHashKey('WEAPON_WOLF')] = '狼',
    [GetHashKey('WEAPON_WOLF_MEDIUM')] = '中型狼',
    [GetHashKey('WEAPON_WOLF_SMALL')] = '小型狼',
    [GetHashKey('WEAPON_ALLIGATOR')] = '短吻鳄',
    [GetHashKey('WEAPON_ANIMAL')] = '动物',
    [GetHashKey('WEAPON_BADGER')] = '獾',
    [GetHashKey('WEAPON_BEAR')] = '熊',
    [GetHashKey('WEAPON_BEAVER')] = '河狸',
    [GetHashKey('WEAPON_COUGAR')] = '美洲狮',
    [GetHashKey('WEAPON_COYOTE')] = '郊狼',
    [GetHashKey('WEAPON_DEER')] = '鹿',
    [GetHashKey('WEAPON_FOX')] = '狐狸',
    [GetHashKey('WEAPON_HORSE')] = '马',
    [GetHashKey('WEAPON_MUSKRAT')] = '麝鼠',
    [GetHashKey('WEAPON_RACCOON')] = '浣熊',
    [GetHashKey('WEAPON_SNAKE')] = '蛇',
    [GetHashKey('WEAPON_FALL')] = '坠落',
    [GetHashKey('WEAPON_FIRE')] = '火焰',
    [GetHashKey('WEAPON_BLEEDING')] = '失血',
    [GetHashKey('WEAPON_DROWNING')] = '溺水',
    [GetHashKey('WEAPON_DROWNING_IN_VEHICLE')] = '在载具中溺水',
    [GetHashKey('WEAPON_EXPLOSION')] = '爆炸',
    [GetHashKey('WEAPON_RAMMED_BY_CAR')] = '被载具撞击',
    [GetHashKey('WEAPON_RUN_OVER_BY_CAR')] = '被载具碾压',

    --  Weapons from game version 1207.80 till 1311.1212
    [GetHashKey('WEAPON_KIT_CAMERA_ADVANCED')] = '高级相机',
    [GetHashKey('WEAPON_MELEE_MACHETE_HORROR')] = '恐怖砍刀',
    [GetHashKey('WEAPON_BOW_IMPROVED')] = '改良弓',
    [GetHashKey('WEAPON_RIFLE_ELEPHANT')] = '大象步枪',
    [GetHashKey('WEAPON_REVOLVER_NAVY')] = '海军左轮',
    [GetHashKey('WEAPON_LASSO_REINFORCED')] = '加固套索',
    [GetHashKey('WEAPON_KIT_BINOCULARS_IMPROVED')] = '改良望远镜',
    [GetHashKey('WEAPON_MELEE_KNIFE_TRADER')] = '商人的刀',
    [GetHashKey('WEAPON_MELEE_MACHETE_COLLECTOR')] = '收藏家的砍刀',
    [GetHashKey('WEAPON_MOONSHINEJUG_MP')] = '私酿烈酒壶',
    [GetHashKey('WEAPON_THROWN_BOLAS')] = '投掷缚绳石',
    [GetHashKey('WEAPON_THROWN_POISONBOTTLE')] = '投掷毒药瓶',

    --  Weapons from game version 1311.12 till 1355.18
    [GetHashKey('WEAPON_KIT_METAL_DETECTOR')] = '金属探测器',
    [GetHashKey('WEAPON_REVOLVER_NAVY_CROSSOVER')] = '海军左轮（跨界）',
    [GetHashKey('WEAPON_THROWN_BOLAS_HAWKMOTH')] = '鹰蛾缚绳石',
    [GetHashKey('WEAPON_THROWN_BOLAS_IRONSPIKED')] = '铁刺缚绳石',
    [GetHashKey('WEAPON_THROWN_BOLAS_INTERTWINED')] = '缠绕缚绳石',

    --  Weapons from game version 1355.18 till 1436.26
    [GetHashKey('WEAPON_MELEE_KNIFE_HORROR')] = '恐怖刀',
    [GetHashKey('WEAPON_MELEE_KNIFE_RUSTIC')] = '乡村刀',
    [GetHashKey('WEAPON_MELEE_LANTERN_HALLOWEEN')] = '万圣节提灯',
}
local deathHashTable = IS_FIVEM and fivemDeathHashTable or redmDeathHashTable

local function processDeath(ped)
    local killerPed = GetPedSourceOfDeath(ped)
    local causeHash = GetPedCauseOfDeath(ped)
    local killer = false
    debugPrint(("Death cause: %s / 0x%x"):format(causeHash, causeHash))

    if killerPed == ped then
        killer = false
    else
        if IsEntityAPed(killerPed) and IsPedAPlayer(killerPed) then
            killer = NetworkGetPlayerIndexFromPed(killerPed)
        elseif IsEntityAVehicle(killerPed) then
            local drivingPed = GetPedInVehicleSeat(killerPed, -1)
            if IsEntityAPed(drivingPed) == 1 and IsPedAPlayer(drivingPed) then
                killer = NetworkGetPlayerIndexFromPed(drivingPed)
            end
        end
    end

    local deathReason = deathHashTable[causeHash] or '未知'

    if not killer then
        if deathReason ~= "未知" then
            deathReason = "自杀 (" .. deathReason .. ")"
        else
            deathReason = "自杀"
        end
    else
        killer = GetPlayerServerId(killer)
    end

    TriggerServerEvent('txsv:logger:deathEvent', killer, deathReason)
end

-- Trigger Event From External Script
-- NOTE: couldn't people just call the txsv:logger:deathEvent event???
RegisterNetEvent('txAdmin:beta:deathLog')
AddEventHandler('txAdmin:beta:deathLog', function(ped)
	processDeath(ped) -- Remember to add a wait function before reviving into an animation.
end)

--[[ Thread ]]--
local deathFlag = false
local IsEntityDead = IsEntityDead
CreateThread(function()
    while true do
        Wait(500)
        local ped = PlayerPedId()
        local isDead = IsEntityDead(ped)
        if isDead and not deathFlag then
            deathFlag = true
            processDeath(ped)
        elseif not isDead then
            deathFlag = false
        end
    end
end)
