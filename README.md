# 安卓证书锁定解除的工具

**经常有朋友问我,手机安装代理证书后这个app的https流量依然抓不到明文包该如何操作,这种情况基本是遇到证书锁定了,分享下我的操作.**

- [x] 目录JustTrustMePlus加了些JusTrustMe没覆盖到的锁定场景.(基于xposed模块[justTrustMe](https://github.com/Fuzion24/JustTrustMe)稍作修改)
	- 使用方法1 : 安装激活xposed后,安装目录下提供的apk,勾选jusTrustMe模块激活重启即可.
- [ ] 目录ObjectionUnpinningPlus加了些ObjectionUnpinning没覆盖到的锁定场景.(基于Frida模块[objection hook pinning](https://github.com/sensepost/objection)稍作修改)
	- 使用方法1 attach : frida -U com.example.mennomorsink.webviewtest2 --no-pause -l hooks.js
	- 使用方法2 spawn : python application.py com.example.mennomorsink.webviewtest2
	- 更为详细使用方法:ToBeDone参考我的文章 [Frida.Android.Practice](https://github.com/WooyunDota/DroidDrops/2018/) 实战ssl pinning bypass 章节 .
- [x] ObjectionUnpinningPlus hook list:
	- SSLcontext(ART only)
	- okhttp
	- webview
	- XUtils(ART only)
	- httpclientandroidlib
	- JSSE
- [x] 若有没有覆盖到的场景可以联系我微博https://weibo.com/luoding1991.
- [ ] 如遇双向锁定即客户端锁定后服务端也对客户端证书验证checkClientTrusted,还需将证书文件导入代理软件,可能会有密码但必然会存在客户端中.
