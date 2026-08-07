local CTRL_MOUSE_LR, CTRL_MOUSE_UD, CTRL_SLOW, CTRL_FAST, CTRL_FRONT_BACK, CTRL_LEFT_RIGHT, CTRL_GO_UP, CTRL_GO_DOWN, CTRL_RIGHT_TRIGGER, CTRL_LEFT_TRIGGER

if IS_FIVEM then
  CTRL_MOUSE_LR = 1               -- 视角：左右 (INPUT_LOOK_LR)
  CTRL_MOUSE_UD = 2               -- 视角：上下 (INPUT_LOOK_UD)
  CTRL_SLOW = 19                  -- 减速 (INPUT_CHARACTER_WHEEL)
  CTRL_FAST = 21                  -- 加速 (INPUT_SPRINT)
  CTRL_GO_UP = 152                -- 上升 (INPUT_PARACHUTE_BRAKE_LEFT)
  CTRL_GO_DOWN = 153              -- 下降 (INPUT_PARACHUTE_BRAKE_RIGHT)
  CTRL_FRONT_BACK = 31            -- 前后移动 (INPUT_MOVE_UD)
  CTRL_LEFT_RIGHT = 30            -- 左右移动 (INPUT_MOVE_LR)

  CTRL_RIGHT_TRIGGER = 71         -- 手柄：加速 (INPUT_VEH_ACCELERATE)
  CTRL_LEFT_TRIGGER = 72          -- 手柄：减速 (INPUT_VEH_BRAKE)
else
  CTRL_MOUSE_LR = 0xA987235F      -- 视角：左右 (INPUT_LOOK_LR)
  CTRL_MOUSE_UD = 0xD2047988      -- 视角：上下 (INPUT_LOOK_UD)
  CTRL_SLOW = 0x580C4473          -- 减速 (INPUT_HUD_SPECIAL)
  CTRL_FAST = 0x8FFC75D6          -- 加速 (INPUT_SPRINT)
  CTRL_GO_UP = 0x06052D11         -- 上升 (INPUT_DIVE)
  CTRL_GO_DOWN = 0xD51B784F       -- 下降 (INPUT_CONTEXT_Y)
  CTRL_FRONT_BACK = 0xFDA83190    -- 前后移动 (INPUT_MOVE_UD)
  CTRL_LEFT_RIGHT = 0x4D8FB4C1    -- 左右移动 (INPUT_MOVE_LR)

  CTRL_RIGHT_TRIGGER = 0x5B9FD4E2 -- 手柄：加速 (INPUT_VEH_ACCELERATE)
  CTRL_LEFT_TRIGGER = 0x6E1F639B  -- 手柄：减速 (INPUT_VEH_BRAKE)
end

--------------------------------------------------------------------------------

local BASE_CONTROL_MAPPING = protect({
  -- 旋转
  LOOK_X = CTRL_MOUSE_LR,
  LOOK_Y = CTRL_MOUSE_UD,

  -- 位置
  MOVE_X = CTRL_LEFT_RIGHT,
  MOVE_Y = CTRL_FRONT_BACK,
  MOVE_Z = { CTRL_GO_UP, CTRL_GO_DOWN },

  -- 倍率
  MOVE_FAST = CTRL_FAST,
  MOVE_SLOW = CTRL_SLOW
})

--------------------------------------------------------------------------------

local BASE_CONTROL_SETTINGS = protect({
  -- 旋转
  LOOK_SENSITIVITY_X = 5,
  LOOK_SENSITIVITY_Y = 5,

  -- 位置
  BASE_MOVE_MULTIPLIER = 0.85,
  FAST_MOVE_MULTIPLIER = 6,
  SLOW_MOVE_MULTIPLIER = 6,
})

--------------------------------------------------------------------------------

local BASE_CAMERA_SETTINGS = protect({
  -- 摄像机
  FOV = 50.0,

  -- 启用/禁用时
  ENABLE_EASING = true,
  EASING_DURATION = 250,

  -- 保持位置/旋转
  KEEP_POSITION = false,
  KEEP_ROTATION = false
})

--------------------------------------------------------------------------------

_G.KEYBOARD_CONTROL_MAPPING = table.copy(BASE_CONTROL_MAPPING)
_G.GAMEPAD_CONTROL_MAPPING = table.copy(BASE_CONTROL_MAPPING)

-- 交换上/下移动（LB 为下降，RB 为上升）
_G.GAMEPAD_CONTROL_MAPPING.MOVE_Z[1] = CTRL_GO_UP
_G.GAMEPAD_CONTROL_MAPPING.MOVE_Z[2] = CTRL_GO_DOWN

-- 使用 LT 和 RT 控制速度
_G.GAMEPAD_CONTROL_MAPPING.MOVE_FAST = CTRL_RIGHT_TRIGGER
_G.GAMEPAD_CONTROL_MAPPING.MOVE_SLOW = CTRL_LEFT_TRIGGER

protect(_G.KEYBOARD_CONTROL_MAPPING)
protect(_G.GAMEPAD_CONTROL_MAPPING)

--------------------------------------------------------------------------------

_G.KEYBOARD_CONTROL_SETTINGS = table.copy(BASE_CONTROL_SETTINGS)
_G.GAMEPAD_CONTROL_SETTINGS = table.copy(BASE_CONTROL_SETTINGS)

-- 手柄灵敏度可基于基础值降低。
_G.GAMEPAD_CONTROL_SETTINGS.LOOK_SENSITIVITY_X = 2
_G.GAMEPAD_CONTROL_SETTINGS.LOOK_SENSITIVITY_Y = 2

protect(_G.KEYBOARD_CONTROL_SETTINGS)
protect(_G.GAMEPAD_CONTROL_SETTINGS)

--------------------------------------------------------------------------------

_G.CAMERA_SETTINGS = table.copy(BASE_CAMERA_SETTINGS)
protect(_G.CAMERA_SETTINGS)

--------------------------------------------------------------------------------

-- 创建一些便捷变量。
-- 允许我们在不切换手柄模式的情况下访问按键和配置。
_G.CONTROL_MAPPING  = CreateGamepadMetatable(_G.KEYBOARD_CONTROL_MAPPING,  _G.GAMEPAD_CONTROL_MAPPING)
_G.CONTROL_SETTINGS = CreateGamepadMetatable(_G.KEYBOARD_CONTROL_SETTINGS, _G.GAMEPAD_CONTROL_SETTINGS)
