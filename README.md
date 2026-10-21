# Arknights: Bluefront

明日方舟第一人称防守同人游戏。进入方块化战场，扮演干员，在三波敌袭中守住蓝门。

桌面浏览器游玩：打开 `dist/index.html`，或使用本仓库托管的在线版本。

## 当前内容

- 能天使：Vector 轮廓铳、黑红袖口与露指手套、过载速射。
- 阿米娅：戒指与蓝黑袖口、手部黑色源石技艺、范围爆发。
- 银灰：杖中剑、深色手套与浅色毛领袖口、远程剑气与真银斩。
- 两张原创测试地图、三波敌袭、使用原作贴图和 Spine 3.5 骨骼动画的士兵与重装防御者。
- 混凝土地块、金属格栅、黄黑警戒线、源石结晶；血量、弹药、装填、技能冷却与小地图。

| 操作 | 按键 |
| --- | --- |
| 移动 | WASD |
| 观察 | 鼠标；方向键左右作为备用 |
| 攻击 | 鼠标左键 / 空格 |
| 技能 | E |
| 装填 / 术式回充 | R |
| 疾跑 | Shift |
| 暂停 | Esc |

点击开始后允许浏览器捕获鼠标；Esc 释放鼠标并暂停。

## 本地开发

不需要安装依赖，不使用外部字体或运行时 CDN。可直接打开 `dist/index.html`；推荐静态服务器：

```sh
python -m http.server 8080 --directory dist
node --check dist/game.js
node --check dist/art.js
node check.cjs
```

`dist/art.js` 绘制材质、敌人和第一视角；`dist/game.js` 实现射线投射渲染与战斗逻辑。当前是 2.5D 原型，不是 Minecraft 模组。敌人包含原作贴图与社区转换的骨骼数据；手臂、武器第一视角为按角色特征生成的同人素材，并非官方第一视角。未包含官方 3D 模型；地图是原创测试布局，第一人称与数值均为同人改编。

## GitHub Pages

首次在 Settings → Pages → Build and deployment → Source 选择 GitHub Actions，之后每次提交到 `main` 会先检查再部署 `dist/`。也可在 Actions 页面手动运行 Deploy Bluefront。

## 参考与署名

非官方同人项目，与鹰角网络及相关发行方无隶属关系。Arknights / 明日方舟的角色、名称和世界观属于相应权利方；绘制素材为本项目重绘。

视觉参考：[能天使](https://prts.wiki/w/能天使)、[阿米娅](https://prts.wiki/w/阿米娅)、[银灰](https://prts.wiki/w/银灰)、[士兵](https://prts.wiki/w/士兵)。


## V0.3 控制与动画

- 鼠标水平转头与上下观察；原生 Pointer Lock 优先，不支持时自动启用鼠标移动转头，屏幕边缘可连续转向。
- 右键瞄准、平滑视野变化、鼠标带动武器摆动、持枪呼吸与脚步摆动。
- 弹簧后坐力回弹、抛壳、枪口火光、分阶段换弹倾转；剑击有预备/横扫/收回轨迹。
- 原作士兵、重装防御者的贴图、骨骼与 Idle / Move_Loop / Attack 动画。

敌人素材来源：[FaterLinLi/Arknights-Enemy](https://github.com/FaterLinLi/Arknights-Enemy)，对应 `Nsabr士兵/Spine` 和 `Shield重装防御者/重装防御者/Spine`。原作内容的权利归原权利方所有。当前读取骨骼变换、IK、区域与网格贴图、帧曲线和绘制顺序；尚未实现 mesh deform 动画，因此部分衣物形变可能与原版有细微差异。


## V0.4 战前编队与 2D 小人风格

首页改为灰白战前编队界面：三张原作干员肖像卡片、关卡地图预览、作战目标，以及右下角红色开始行动按钮。选择仍为单人操控一名干员。

第一视角改为粗描边、简化阴影、色块和短圆手指的 2D 小人风格；保留角色袖口、Vector 铳、源石术式和杖中剑的辨识特征。第一视角为生成的同人素材，并非原版第一视角。

编队肖像来源：[yuanyan3060/ArknightsGameResource](https://github.com/yuanyan3060/ArknightsGameResource) 的 `portrait/char_103_angel_1.png`、`portrait/char_002_amiya_1.png`、`portrait/char_172_svrash_1.png`，原作美术权利归原权利方所有。
