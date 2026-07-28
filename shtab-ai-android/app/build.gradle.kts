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
        versionCode = 2
        versionName = "1.1.0"
    }

    buildTypes {
        debug {
            applicationIdSuffix = ""
            versionNameSuffix = ""
        }
    }
}
