#import "AppDelegate.h"
#import <EXSplashScreen/EXSplashScreenService.h>
#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

#import "ExpoModulesCore-Swift.h"
#import "EXUpdatesInterface-Swift.h"
#import "EXUpdates-Swift.h"

@interface AppDelegate ()

@property (nonatomic, strong) NSDictionary *launchOptions;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];

  #ifdef DEBUG
    [self initializeReactNativeApp];
  #else
  
    EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
    controller.delegate = self;
    [controller startAndShowLaunchScreen:self.window];
  #endif
 
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (RCTBridge *)initializeReactNativeApp
{
  // Initialize the React Native bridge for development builds
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];
  return bridge;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@".expo/.virtual-metro-entry"];
#else
  // For release builds, use the launch asset URL from EXUpdatesAppController
  return [[EXUpdatesAppController sharedInstance] launchAssetUrl];
#endif
}

- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success {
  [self initializeReactNativeApp];
}

@end
