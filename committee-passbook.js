"use strict";

async function uploadCommitteePassbook({db,storage,uid,file,expected,onProgress}){
  const types={pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png"};
  const ext=file.name.toLowerCase().match(/\.(pdf|jpg|jpeg|png)$/)?.[1];
  if(!ext)throw new Error("格式須為 JPG／PNG／PDF。");
  if(!file.size||file.size>=50*1024*1024)throw new Error("檔案大小須大於 0 且小於 50 MB。");

  const at=Date.now();
  const folder="committee/"+uid+"/";
  const path=folder+"passbook_"+at+"_"+crypto.randomUUID().replace(/-/g,"")+"."+ext;
  const ref=storage.ref(path);
  const doc=db.doc("committeeDocs/"+uid);
  const discard=async()=>{await ref.delete().catch(()=>{});};
  let metadata;

  try{
    const task=ref.put(file,{contentType:types[ext]});
    task.on("state_changed",snapshot=>{
      onProgress(Math.round(100*snapshot.bytesTransferred/snapshot.totalBytes));
    });
    await task;
    metadata={name:file.name,path,url:await ref.getDownloadURL(),size:file.size,at};
  }catch(error){
    await discard();
    throw error;
  }

  const identity=record=>record?.path||record?.url||"";
  let previous;
  try{
    previous=await db.runTransaction(async transaction=>{
      const old=(await transaction.get(doc)).data()?.passbook;
      if(old?.path===path)return null;
      if(identity(old)!==identity(expected)){
        throw new Error("存簿封面已有更新，請重新整理後再上傳。");
      }
      transaction.set(doc,{
        passbook:metadata,
        updatedAt:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      return old;
    });
  }catch(error){
    // 如果無法確認 Firestore 提交結果，保留新檔以免刪除已儲存的封面。
    const current=await doc.get({source:"server"}).catch(()=>null);
    if(current?.data()?.passbook?.path===path)return metadata;
    if(current)await discard();
    throw error;
  }

  const oldPath=previous?.path;
  if(oldPath?.startsWith(folder)&&
    /^passbook_[0-9]+(?:_[a-f0-9]{32})?\.(pdf|jpg|jpeg|png)$/i.test(oldPath.slice(folder.length))){
    await storage.ref(oldPath).delete().catch(()=>{});
  }
  return metadata;
}
