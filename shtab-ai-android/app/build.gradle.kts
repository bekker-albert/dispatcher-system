plugins { id("com.android.application") }
android {
    namespace = "kz.shtabai.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "kz.shtabai.app"
        minSdk = 23
        targetSdk = 35
        versionCode = 26
        versionName = "4.6.2"
    }
    signingConfigs {
        create("release") {
            storeFile = file("../shtab-ai-release.jks")
            storePassword = "ShtabAI2026!"
            keyAlias = "shtabai"
            keyPassword = "ShtabAI2026!"
        }
    }
    buildTypes {
        getByName("debug") { signingConfig = signingConfigs.getByName("release") }
        getByName("release") { isMinifyEnabled = false; signingConfig = signingConfigs.getByName("release") }
    }
}
