import { api } from "@/api";
import { UploadDropzone } from "@/engine/fileupload/utils";
import { Router } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";
import { toast } from "react-hot-toast";
import { UploadFileResponse } from "uploadthing/client";

type Props = {
  setUploaderOpen: any;
};

const FileUploader = ({ setUploaderOpen }: Props) => {
  return (
    <div className="w-full h-full">
      <UploadDropzone
        endpoint="imageUploader"
        onClientUploadComplete={async res => {
          await api.patch("/user/update/avatar", {
            avatarUrl: (res as UploadFileResponse[])[0].url,
          });
          setUploaderOpen(false);
          toast.success("Profile image changed");
        }}
        onUploadError={(error: Error) => {
          toast.error("Profile change failed");
        }}
      />
    </div>
  );
};

export default FileUploader;
