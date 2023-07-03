import React, { useEffect, useState } from "react";
import { Switch } from "../ui/switch";
import { Select, SelectTrigger } from "../ui/select";
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@radix-ui/react-select";

const SettingsSheet = () => {
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState("");
  useEffect(() => {
    // Function to retrieve the available microphones
    const getMicrophones = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const microphoneDevices = devices.filter(
          device => device.kind === "audioinput"
        );

        setMicrophones(microphoneDevices);
      } catch (error) {
        console.error("Error retrieving microphones:", error);
      }
    };

    getMicrophones();
  }, []);

  const handleMicrophoneChange = (event: any) => {
    setSelectedMicrophone(event.target.value);
  };

  return (
    <div className="w-full">
      <div className="z-50">
        <div>Preferred Microphone</div>
        <div>
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={selectedMicrophone || "Select a microphone"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {microphones.map(microphone => (
                  <SelectItem
                    key={microphone.deviceId}
                    value={microphone.deviceId}
                    // onClick={handleMicrophoneChange}
                  >
                    {microphone.label || `Microphone ${microphone.deviceId}`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SettingsSheet;
