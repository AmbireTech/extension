# Kept by hand, unlike the rest of android/.
#
# ubrn's build.gradle template references this file from consumerProguardFiles
# unconditionally, but only emits it when generating with --native-bindings,
# which is the JNA-based Kotlin path this module does not use. Without the file
# the reference dangles, which is harmless while the app has
# android.enableMinifyInReleaseBuilds off and an error the moment it is turned
# on.
#
# The rules below are ubrn's own. They are no-ops for the JSI path — nothing
# here loads JNA — but they are kept verbatim so this file stays a copy of
# upstream rather than something to reason about.
-dontwarn java.awt.*
-keep class com.sun.jna.* { *; }
-keepclassmembers class * extends com.sun.jna.* { public *; }
