import usePost from "@hooks/usePost";
import { router } from "expo-router";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";

export default function Page() {
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView>(null);
  const [processing, setProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [hasPermission, requestPermission] = useCameraPermissions();
  const { data, errorMsg, loading, postData } = usePost("/api/v1/detect");

  let cameraOptions = {
    quality: 1,
    base64: true,
    exif: true,
  };

  // Foreground location for user when using the app
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Request Permission",
          "We need your location to use this feature"
        );
        requestPermission();
        return;
      }
    })();
  }, []);

  // shows alert when an error message is changed
  useEffect(() => {
    if (errorMsg) {
      Alert.alert("An error has occured", errorMsg);
      return;
    }
  }, [errorMsg]);

  // shows the message when the server returns a response
  useEffect(() => {
    if (data) {
      Alert.alert("Fire detection AI", data.message);
      return;
    }
  }, [data]);

  // camera persmission still loading
  if (!hasPermission) {
    return <View />;
  }

  // camera permission not granted by user
  if (!hasPermission.granted) {
    return (
      <View className="flex-1 justify-center">
        <Text className="flex-1 justify-center text-center text-base">
          Allow camera permission to use this feature.
        </Text>
        <Button title="Grant permission" onPress={requestPermission}></Button>
      </View>
    );
  }

  // bring user back to dashboard
  async function onCloseButtonPress() {
    if (cameraRef.current) {
      try {
        await cameraRef.current.pausePreview;
      } catch (error) {}
    }
    router.replace("/(authenticated)/(tabs)/dashboard");
  }

  // take picture when user press shuttle button
  async function onShuttlePress() {
    if (cameraRef.current && !loading && !processing) {
      setProcessing(true);

      const photo = await cameraRef.current.takePictureAsync(cameraOptions);
      let userLocation = await Location.getCurrentPositionAsync({});

      postData({ image: photo?.base64, location: userLocation });

      setProcessing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 justify-center bg-black">
      <StatusBar style="dark" />
      <View className="flex-1 rounded-3xl mx-1 overflow-hidden">
        {isFocused && (
          <CameraView className="flex-1" facing={facing} ref={cameraRef}>
            <StatusBar style="light" />
            <View className="flex-1 pt-5 px-5">
              <TouchableOpacity onPress={onCloseButtonPress}>
                <Ionicons name="close-outline" size={48} color="white" />
              </TouchableOpacity>
            </View>

            {loading ||
              (processing && (
                <ActivityIndicator
                  className="flex-1 justify-center items-center"
                  size="large"
                  color="#FFFFFF"
                />
              ))}

            <View className="flex-1 items-center flex-col-reverse pb-5">
              <TouchableOpacity onPress={onShuttlePress}>
                <Ionicons name="camera-outline" size={48} color="white" />
              </TouchableOpacity>
            </View>
          </CameraView>
        )}
      </View>
    </SafeAreaView>
  );
}
