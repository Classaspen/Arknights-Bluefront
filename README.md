# Arknights: Bluefront

明日方舟第一人称防守同人游戏。进入方块化战场，扮演干员，在三波敌袭中守住蓝门。

桌面浏览器游玩：打开 `dist/index.html`，或使用本仓库托管的在线版本。

## 当前内容

- 能天使：Vector 轮廓铳、黑红袖口与露指手套、过载速射。
- 阿米娅：戒指与蓝黑袖口、手部黑色源石技艺、范围爆发。
- 银灰：杖中剑、深色手套与浅色毛领袖口、远程剑气与真银斩。
- 两张原创测试地图、三波敌袭、整合运动风格士兵与重装兵。
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

`dist/art.js` 绘制材质、敌人和第一视角；`dist/game.js` 实现射线投射渲染与战斗逻辑。当前是 2.5D 原型，不是 Minecraft 模组。素材按原作角色特征重绘，未包含官方原始贴图、3D 模型或 Spine 文件；地图是原创测试布局，第一人称与数值均为同人改编。

## GitHub Pages

首次在 Settings → Pages → Build and deployment → Source 选择 GitHub Actions，之后每次提交到 `main` 会先检查再部署 `dist/`。也可在 Actions 页面手动运行 Deploy Bluefront。

## 参考与署名

非官方同人项目，与鹰角网络及相关发行方无隶属关系。Arknights / 明日方舟的角色、名称和世界观属于相应权利方；绘制素材为本项目重绘。

视觉参考：[能天使](https://prts.wiki/w/能天使)、[阿米娅](https://prts.wiki/w/阿米娅)、[银灰](https://prts.wiki/w/银灰)、[士兵](https://prts.wiki/w/士兵)。
