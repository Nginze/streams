import { generateComponents } from "@uploadthing/react";
import { OurFileRouter, ourFileRouter } from "./uploadthing";
 
 
export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>();