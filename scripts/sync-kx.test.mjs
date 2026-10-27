import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { references, synchronize } from "./sync-kx.mjs";
const root=fs.mkdtempSync(path.join(os.tmpdir(),"kx-docs-sync-")),studio=path.join(root,"studio"),docs=path.join(root,"docs");
const write=(root,name,text)=>{const file=path.join(root,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,text);};
try{
 write(studio,"public/kx-api.json",JSON.stringify({language:"KX",version:"2.1",items:[],declarations:[],namespaces:{}}));write(studio,"package.json",JSON.stringify({version:"2.4.fixture"}));
 for(const [,title,file] of references)write(studio,file,`# ${title}\n`);
 write(studio,"examples/root.kx","pipeline({});\n");write(studio,"examples/v23/same.kx","pipeline({name: \"one\"});");write(studio,"examples/v24/same.kx","pipeline({name: \"two\"});");
 write(studio,references[0][2],"# Workspace\r\nWindows line endings\r\n");
 synchronize(studio,docs);synchronize(studio,docs,true);
 const managedExample=path.join(docs,"public/examples/root.kx");fs.writeFileSync(managedExample,fs.readFileSync(managedExample,"utf8").replace(/\n/g,"\r\n"));synchronize(studio,docs,true);

 assert.notEqual(fs.readFileSync(path.join(docs,"public/examples/v23/same.kx"),"utf8"),fs.readFileSync(path.join(docs,"public/examples/v24/same.kx"),"utf8"));
 write(docs,"src/generated/kx-api.json","{}");assert.throws(()=>synchronize(studio,docs,true),/out of sync/);synchronize(studio,docs);
 write(docs,"public/examples/unmanaged.kx","user example");fs.unlinkSync(path.join(studio,"examples/v23/same.kx"));assert.throws(()=>synchronize(studio,docs,true),/out of sync/);synchronize(studio,docs);
 assert(!fs.existsSync(path.join(docs,"public/examples/v23/same.kx")));assert(fs.existsSync(path.join(docs,"public/examples/unmanaged.kx")));
 const before=fs.readFileSync(path.join(docs,"src/generated/studio-docs.json"),"utf8");fs.unlinkSync(path.join(studio,references[0][2]));assert.throws(()=>synchronize(studio,docs));assert.equal(fs.readFileSync(path.join(docs,"src/generated/studio-docs.json"),"utf8"),before);
 console.log("Recursive sync, portable line endings, collision preservation, complete drift checks, managed-only cleanup and missing-reference failure: PASS");
}finally{assert(root.startsWith(path.resolve(os.tmpdir())+path.sep) && path.basename(root).startsWith("kx-docs-sync-"));fs.rmSync(root,{recursive:true,force:true});}
