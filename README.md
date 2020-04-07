# 安卓证书锁定解除的工具

**经常有朋友问我,手机安装代理证书后这个app的https流量依然抓不到明文包该如何操作,这种情况基本是遇到证书锁定了,分享下我的操作.**

- [x] 目录ObjectionUnpinningPlus增加了ObjectionUnpinning没覆盖到的锁定场景.([objection](https://github.com/sensepost/objection))
	- 使用方法1 attach : frida -U com.example.mennomorsink.webviewtest2 --no-pause -l hooks.js
	- 使用方法2 spawn : frida -U -f com.example.mennomorsink.webviewtest2 -l hooks.js --no-pause
	- 更为详细使用方法:参考我的文章 [Frida.Android.Practice(ssl unpinning)](https://github.com/WooyunDota/DroidDrops/blob/master/2018/Frida.Android.Practice.md) 实战ssl pinning bypass 章节 .
- [x] ObjectionUnpinningPlus hook list:
	- SSLcontext(ART only)
	- okhttp
	- webview
	- XUtils(ART only)
	- httpclientandroidlib
	- JSSE
	- network\_security\_config (android 7.0+)
	- Apache Http client (support partly)
	- OpenSSLSocketImpl
	- TrustKit
	- Cronet
- [x] 若有没有覆盖到的场景可以联系我微博https://weibo.com/luoding1991.
- [x] 如遇双向锁定即客户端锁定后服务端也对客户端证书验证checkClientTrusted,还需将证书文件导入代理软件,可能会有密码但必然会存在客户端中.
- [x] xposed版本直接使用 https://github.com/Fuzion24/JustTrustMe 建议自己编译.
