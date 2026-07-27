plugins {
    id("com.android.application")
}

android {
    namespace = "kz.shtabai.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "kz.shtabai.app"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ""
            versionNameSuffix = ""
        }
    }
}
