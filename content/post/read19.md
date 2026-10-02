{
  "title": "Read19：我做了一个云端围棋复盘工具",
  "date": "2026-10-02T16:14:00+08:00",
  "url": "/post/read19/",
  "draft": false,
  "tags": ["Read19", "围棋", "KataGo"],
  "categories": ["项目"]
}

最近在做一个围棋项目，叫 **Read19**。我把 KataGo 放在云端，做了网页和各平台的客户端：打开棋谱，就能看胜率、目差和候选着，不用先在自己的电脑上配 GPU、驱动和模型。

官网：[read19.com](https://read19.com/)。想先看界面，可以直接打开[示例棋谱](https://read19.com/review/sample)。

{{< screenshot src="/img/read19/review-sample.png" alt="Read19 复盘界面：左侧变化图、中间棋盘、右侧 KataGo 候选着" width="1440" height="960" >}}
官网的公开示例棋谱。左边是变化图，中间是棋盘，右边可以看候选着、胜率、目差和搜索量。
{{< /screenshot >}}

## 复盘时，可以沿着变化继续看

我把棋盘、变化图和整局走势放在一个界面里。导入 SGF 后，可以先看整盘棋在哪些地方发生转折，再点回那一步，比较实战落子和 KataGo 的推荐。

候选着可以展开成变化，也能继续试走。实战棋谱和研究分支分别保留，试另一种下法时，不会把原来的对局改掉。看完以后，可以导出 SGF，拿到其他围棋软件里继续研究。

这里我同时显示胜率和目差。领先很多时，丢几目未必会让胜率明显下降；局面接近时，几目的变化又可能决定胜负。先用趋势找到值得看的地方，再回棋盘看变化，比只盯着一个百分比更有用。

{{< screenshot src="/img/read19/trends-sample.png" alt="Read19 的整局胜率走势，可以点击或拖动曲线回到对应手数" width="1440" height="960" >}}
同一份示例棋谱的走势面板。点按或拖动曲线，就能回到对应局面；也可以切换目差和问题手范围。
{{< /screenshot >}}

除了导入自己的棋谱，Read19 还有[在线对局](https://read19.com/play)，可以和 KataGo 下一盘，再回来复盘。

## 已经在用 KaTrain，也可以接过来

Read19 不只提供自己的棋盘，也提供云端 KataGo 接口。如果你习惯了 KaTrain，可以继续用它，在远程引擎设置里填入个人 WSS 地址，让计算在 Read19 上跑。

我也做了一个 [Read19 CLI](https://read19.com/cli)，在本机桥接 GTP 协议，让 Sabaki、q5Go、Lizzie 等桌面软件连接云端引擎。棋盘和操作方式还是原来的，只是不用在本机运行 KataGo。

自己写工具的话，可以使用 WebSocket 接收流式分析，或者通过 REST 发起单次分析。协议和配置方法都放在[开发者页面](https://read19.com/developers)，注册后创建自己的 API Token 就能接入。

云端计算需要网络连接。搜索量可以按需要调整：先看一遍整盘棋，再给想研究的几个局面更多计算量，不必每一步都用同样的强度。

## 电脑和手机都能看

网页版直接打开就能用。Windows、macOS 和 Android 的安装包放在官网，iPhone / iPad 有 App Store 入口，具体版本见[下载页面](https://read19.com/#download)。

棋谱先保存在本机，登录后可以通过 Read19 云棋谱库在不同设备间同步。也可以自己保留一份 SGF，之后换工具时继续用。

目前 Free Beta 每月有 **100,000 个 KataGo 分析单位**，单个局面最高 1,000 个，同时可以跑 3 个分析任务。这个额度也能给 KaTrain 和自己的工具用。

分析单位算的是 KataGo 的树搜索计算。需要更多额度时，可以一次性购买，购买的部分永久保留。具体额度和价格以[官网](https://read19.com/#pricing)为准。

## 想试试的话

有 SGF 可以直接去[复盘页面](https://read19.com/review)导入；暂时没有棋谱，可以先打开[示例](https://read19.com/review/sample)，看看候选着、变化图和趋势之间怎么切换。想保留现有客户端，就从 [KaTrain 连接说明](https://read19.com/developers)或 [CLI](https://read19.com/cli)开始。

我还在继续完善这个项目。棋谱导入、变化图操作、手机上的复盘布局，或者现有围棋软件的接入，遇到问题都可以在文章下留言，也可以通过[支持页面](https://read19.com/support)反馈。带上平台、版本和复现步骤，我会比较好排查。
