import { stopMock } from "./mock-process";

export default async function globalTeardown() {
  await stopMock();
}
