package com.pcibethel.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int APP_PERMISSIONS_REQUEST_CODE = 101;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        checkAndRequestAppPermissions();
    }

    private void checkAndRequestAppPermissions() {
        List<String> permissionsList = new ArrayList<>();

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsList.add(Manifest.permission.CAMERA);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsList.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }

        if (!permissionsList.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsList.toArray(new String[0]), APP_PERMISSIONS_REQUEST_CODE);
        }
    }
}
