import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { app } from "electron";


const execAsync = promisify(exec);

export async function generateBatteryReport(): Promise<string>{

    const docsDir = app.getPath("documents");
  
    // Combine docsDir with the desired file name
    const reportPath = path.join(docsDir, "battery-report.html");

    const cmd = `powercfg /batteryreport /output ${reportPath}`;
    await execAsync(cmd);

    return reportPath;
}