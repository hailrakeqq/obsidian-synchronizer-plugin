import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import JSZip from "jszip";
import FormData from "form-data";
import os from "os"

export class Toolchain {
    static isDirectoryEmpty(path: string): boolean {
        if (!fs.existsSync(path)) {
            return true;
        }

        return fs.readdirSync(path).length === 0;
    } 
     
    static async createZipArchive(sourceDir: string, outPath: string): Promise<void> {
        const zip = new JSZip();

        function addFolderToZip(dir: string, basePath = "") {
            const entries = fs.readdirSync(dir);

            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                const stat = fs.statSync(fullPath);

                const zipPath = path.join(basePath, entry);

                if (stat.isDirectory()) {
                    addFolderToZip(fullPath, zipPath);
                } else {
                    const fileData = fs.readFileSync(fullPath);
                    zip.file(zipPath, fileData);
                }
            }
        }

        addFolderToZip(sourceDir);

        const content = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: {
                level: 9
            }
        });

        fs.writeFileSync(outPath, content);
    }
  
    static unzipAchive(zipArchivePath: string, targetDir: string) {
        console.log("Unarchive zip from server");

        const zip = new AdmZip(zipArchivePath);
        const entries = zip.getEntries();

        for (const entry of entries) {
            const entryName = entry.entryName;

            if (entryName.startsWith(".obsidian")) continue;

            const outputPath = path.join(targetDir, entryName);

            if (entry.isDirectory) {
                fs.mkdirSync(outputPath, { recursive: true });
                continue;
            }

            // create dirs
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });

            // write file
            fs.writeFileSync(outputPath, entry.getData());
        }

        fs.rmSync(path.join(os.tmpdir(), "obsidian-synchronizer-from-server"), {
            recursive: true,
            force: true
        });
    }

    static async uploadToServer(serverPath: string, zipPath: string, vaultName: string, API_TOKEN: string) { 
        const zipBuffer = fs.readFileSync(zipPath);
        const blob = new Blob(
            [new Uint8Array(zipBuffer)],
            { type: "application/zip" }
        );
        const metadata = {
            vaultname: vaultName,
            timeStamp: this.getFormatedTimestamp()
        };

        const formData = new FormData();
        formData.append(
            "file",
            blob,
            "vault-latest.zip"
        );
        formData.append("metadata", JSON.stringify(metadata));
       
        const request = await fetch(
            `${serverPath}/upload`,
            {
                headers: {
    			    Authorization: `Bearer ${API_TOKEN}`
    			},
                method: "POST",
                body: formData as any
            }
        );
        return request.status;
    }

    static async getAvailableBackupsFromServer(serverPath: string, vaultName: string,  API_TOKEN: string){
        const response = await fetch(
            `${serverPath}/vaults-lists?vaultname=${vaultName}`,
            { 
                headers: {
    			    Authorization: `Bearer ${API_TOKEN}`
    			},
                method: "GET" 
            }
        );
    
        const data = await response.json();
 
        return data;
    }

    static async downloadFromServer(serverPath: string, archiveName: string, vaultName: string, saveDir: string,  API_TOKEN: string){
        const metadata = {
            vaultname: vaultName,
            backupname: archiveName
        };
        
        const formData = new FormData();
       
        formData.append("metadata", JSON.stringify(metadata));
        
        const request = await fetch(`${serverPath}/download`, {
            headers: {
    			Authorization: `Bearer ${API_TOKEN}`
    		},
            method: "POST", 
            body: formData as any
        }) 

        if(!request.ok){
            return "Download failed"
        }

        const arrayBuffer = await request.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        const filePath = path.join(saveDir, archiveName)

        fs.writeFileSync(filePath, buffer)

        return filePath
    }

    static getFormatedTimestamp(){
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted =
          `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_` +
          `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        return formatted
    }
}