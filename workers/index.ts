import { setupWsWorker } from "./core/setupWorker";
try {
  setupWsWorker();
} catch (error) {
  console.log(error);
}
