Java.perform(function() {

/*
hook list:
1.SSLcontext
2.okhttp
3.webview
4.XUtils
5.httpclientandroidlib
6.JSSE
*/

// Attempts to bypass SSL pinning implementations in a number of
// ways. These include implementing a new TrustManager that will
// accept any SSL certificate, overriding OkHTTP v3 check()
// method etc.

// var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
var X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
var SSLContext = Java.use('javax.net.ssl.SSLContext');
var quiet_output = false;

// Helper method to honor the quiet flag.
function quiet_send(data) {

    if (quiet_output) {

        return;
    }

    send(data)
}



// //Implement a new HostnameVerifier
// var TrustHostnameVerifier;
// try {
//     TrustHostnameVerifier = Java.registerClass({
//         name: 'org.wooyun.TrustHostnameVerifier',
//         implements: [HostnameVerifier],
//         method: {
//             verify: function (hostname, session) {
//                 return true;
//             }
//         }
//     });
//
// } catch (e) {
//     //java.lang.ClassNotFoundException: Didn't find class "org.wooyun.TrustHostnameVerifier"
//     console.log("registerClass from hostnameVerifier >>>>>>>> " + e.message);
// }

// Implement a new TrustManager
// ref: https://gist.github.com/oleavr/3ca67a173ff7d207c6b8c3b0ca65a9d8
// Java.registerClass() is only supported on ART for now(201803). 所以android 4.4以下不兼容,4.4要切换成ART使用.

var TrustManager;
try {
    TrustManager = Java.registerClass({
        name: 'com.sensepost.test.TrustManager',
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted: function (chain, authType) {
            },
            checkServerTrusted: function (chain, authType) {
            },
            getAcceptedIssuers: function () {
                return [];
            }
        }
    });
} catch (e) {
    console.log("registerClass from X509TrustManager >>>>>>>> " + e.message);
}





// Prepare the TrustManagers array to pass to SSLContext.init()
var TrustManagers = [TrustManager.$new()];

try {
    // Prepare a Empty SSLFactory
    var TLS_SSLContext = SSLContext.getInstance("TLS");
    TLS_SSLContext.init(null,TrustManagers,null);
    var EmptySSLFactory = TLS_SSLContext.getSocketFactory();
} catch (e) {
    console.log(e.message);
}

send('Custom, Empty TrustManager ready');

// Get a handle on the init() on the SSLContext class
var SSLContext_init = SSLContext.init.overload(
    '[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom');

// Override the init method, specifying our new TrustManager
SSLContext_init.implementation = function (keyManager, trustManager, secureRandom) {

    quiet_send('Overriding SSLContext.init() with the custom TrustManager');

    SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
};

/*** okhttp3.x unpinning ***/


// Wrap the logic in a try/catch as not all applications will have
// okhttp as part of the app.
try {

    var CertificatePinner = Java.use('okhttp3.CertificatePinner');

    send('OkHTTP 3.x Found');

    CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function () {

        quiet_send('OkHTTP 3.x check() called. Not throwing an exception.');
    }

} catch (err) {

    // If we dont have a ClassNotFoundException exception, raise the
    // problem encountered.
    if (err.message.indexOf('ClassNotFoundException') === 0) {

        throw new Error(err);
    }
}

// Appcelerator Titanium PinningTrustManager

// Wrap the logic in a try/catch as not all applications will have
// appcelerator as part of the app.
try {

    var PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');

    send('Appcelerator Titanium Found');

    PinningTrustManager.checkServerTrusted.implementation = function () {

        quiet_send('Appcelerator checkServerTrusted() called. Not throwing an exception.');
    }

} catch (err) {

    // If we dont have a ClassNotFoundException exception, raise the
    // problem encountered.
    if (err.message.indexOf('ClassNotFoundException') === 0) {

        throw new Error(err);
    }
}

/*** okhttp unpinning ***/


try {
    var OkHttpClient = Java.use("com.squareup.okhttp.OkHttpClient");
    OkHttpClient.setCertificatePinner.implementation = function(certificatePinner){
        // do nothing
        console.log("OkHttpClient.setCertificatePinner Called!");
        return this;
    };

    // Invalidate the certificate pinnet checks (if "setCertificatePinner" was called before the previous invalidation)
    var CertificatePinner = Java.use("com.squareup.okhttp.CertificatePinner");
    CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function(p0, p1){
        // do nothing
        console.log("okhttp Called! [Certificate]");
        return;
    };
    CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(p0, p1){
        // do nothing
        console.log("okhttp Called! [List]");
        return;
    };
} catch (e) {
 console.log("com.squareup.okhttp not found");
}

/*** WebView Hooks ***/

/* frameworks/base/core/java/android/webkit/WebViewClient.java */
/* public void onReceivedSslError(Webview, SslErrorHandler, SslError) */
var WebViewClient = Java.use("android.webkit.WebViewClient");

WebViewClient.onReceivedSslError.implementation = function (webView,sslErrorHandler,sslError){
    quiet_send("WebViewClient onReceivedSslError invoke");
    //执行proceed方法
    sslErrorHandler.proceed();
    return ;
};

WebViewClient.onReceivedError.overload('android.webkit.WebView', 'int', 'java.lang.String', 'java.lang.String').implementation = function (a,b,c,d){
    quiet_send("WebViewClient onReceivedError invoked");
    return ;
};

WebViewClient.onReceivedError.overload('android.webkit.WebView', 'android.webkit.WebResourceRequest', 'android.webkit.WebResourceError').implementation = function (){
    quiet_send("WebViewClient onReceivedError invoked");
    return ;
};

/*** JSSE Hooks ***/

/* libcore/luni/src/main/java/javax/net/ssl/TrustManagerFactory.java */
/* public final TrustManager[] getTrustManager() */

var TrustManagerFactory = Java.use("javax.net.ssl.TrustManagerFactory");
TrustManagerFactory.getTrustManagers.implementation = function(){
    quiet_send("TrustManagerFactory getTrustManagers invoked");
    return TrustManagers;
}

var HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
/* libcore/luni/src/main/java/javax/net/ssl/HttpsURLConnection.java */
/* public void setDefaultHostnameVerifier(HostnameVerifier) */
HttpsURLConnection.setDefaultHostnameVerifier.implementation = function(hostnameVerifier){
    quiet_send("HttpsURLConnection.setDefaultHostnameVerifier invoked");
        return null;
};
/* libcore/luni/src/main/java/javax/net/ssl/HttpsURLConnection.java */
/* public void setSSLSocketFactory(SSLSocketFactory) */
HttpsURLConnection.setSSLSocketFactory.implementation = function(SSLSocketFactory){
    quiet_send("HttpsURLConnection.setSSLSocketFactory invoked");
        return null;
};
/* libcore/luni/src/main/java/javax/net/ssl/HttpsURLConnection.java */
/* public void setHostnameVerifier(HostnameVerifier) */
HttpsURLConnection.setHostnameVerifier.implementation = function(hostnameVerifier){
    quiet_send("HttpsURLConnection.setHostnameVerifier invoked");
        return null;
};

/*** Xutils3.x hooks ***/

try {
    var RequestParams = Java.use('org.xutils.http.RequestParams');
    RequestParams.setSslSocketFactory.implementation = function(sslSocketFactory){
        sslSocketFactory = EmptySSLFactory;
        return null;
    }

    // RequestParams.setHostnameVerifier.implementation = function(hostnameVerifier){
    //     hostnameVerifier = TrustHostnameVerifier.$new();
    //     return null;
    // }

} catch (e) {
    console.log("Xutils hooks not Found");
}

/*** httpclientandroidlib Hooks ***/
try {
    var AbstractVerifier = Java.use("ch.boye.httpclientandroidlib.conn.ssl.AbstractVerifier");
    AbstractVerifier.verify.overload('java.lang.String','[Ljava.lang.String','[Ljava.lang.String','boolean').implementation = function(){
        quiet_send("httpclientandroidlib Hooks");
        return null;
    }
} catch (e) {
    console.log("httpclientandroidlib Hooks not found");
}

/*** Apache http Hooks ***/
/* android6.0 api23 开始不集成Apache http client , 还想用Apache httpClient的话需自己集成到app中,所以实际使用者变少*/

// var SSLSocketFactory = Java.use("org.apache.http.conn.ssl.SSLSocketFactory");
// /* external/apache-http/src/org/apache/http/conn/ssl/SSLSocketFactory.java */
// /* public SSLSocketFactory( ... ) */
//
// SSLSocketFactory.$init.implementation = function(algorithm,keystore,keystorePassword,random){
//     quiet_send("keystorePassword = " + keystorePassword);
//
//     return this.$init.call(this,algorithm,keystore,keystorePassword,random);
// }
//
// /* external/apache-http/src/org/apache/http/conn/ssl/SSLSocketFactory.java */
// /* public static SSLSocketFactory getSocketFactory() */
// SSLSocketFactory.getSocketFactory.implementation = function(){
//     return SSLSocketFactory.$new();
// }
//
// /* external/apache-http/src/org/apache/http/conn/ssl/SSLSocketFactory.java */
// /* public boolean isSecure(Socket) */
//
// SSLSocketFactory.isSecure.implementation = function (){
//
//     return true;
// }

// -- Sample Java
//
// "Generic" TrustManager Example
//
// TrustManager[] trustAllCerts = new TrustManager[] {
//     new X509TrustManager() {
//         public java.security.cert.X509Certificate[] getAcceptedIssuers() {
//             return null;
//         }
//         public void checkClientTrusted(X509Certificate[] certs, String authType) {  }

//         public void checkServerTrusted(X509Certificate[] certs, String authType) {  }

//     }
// };

// SSLContext sslcontect = SSLContext.getInstance("TLS");
// sslcontect.init(null, trustAllCerts, null);

// OkHTTP 3 Pinning Example
// String hostname = "swapi.co";
// CertificatePinner certificatePinner = new CertificatePinner.Builder()
//         .add(hostname, "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
//         .build();

// OkHttpClient client = new OkHttpClient.Builder()
//         .certificatePinner(certificatePinner)
//         .build();

// Request request = new Request.Builder()
//         .url("https://swapi.co/api/people/1")
//         .build();

// Response response = client.newCall(request).execute();
});
