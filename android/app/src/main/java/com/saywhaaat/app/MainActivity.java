package com.saywhaaat.app;

import android.content.Intent;
import android.os.Bundle; // Added for completeness
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // This is the "Handshake" line.
        // It tells Capacitor: "Hey, someone clicked a link, here is the data!"
        setIntent(intent);
    }
}