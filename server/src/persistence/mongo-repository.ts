import type { ClientSession, Collection, Db, MongoClient } from 'mongodb';
import { COLLECTIONS } from './mongo-schema.js';
import type { ActorDocument, AuditEventDocument, BoardDocument, TaskDocument } from './documents.js';
export class MongoRepository {
 private readonly actors:Collection<ActorDocument>;private readonly boards:Collection<BoardDocument>;private readonly tasks:Collection<TaskDocument>;private readonly auditEvents:Collection<AuditEventDocument>;
 constructor(private readonly client:MongoClient,db:Db){this.actors=db.collection(COLLECTIONS.actors);this.boards=db.collection(COLLECTIONS.boards);this.tasks=db.collection(COLLECTIONS.tasks);this.auditEvents=db.collection(COLLECTIONS.auditEvents);}
 async inTransaction<T>(operation:(session:ClientSession|undefined)=>Promise<T>):Promise<T>{const session=this.client.startSession();let result!:T;try{await session.withTransaction(async()=>{result=await operation(session);return result;});return result;}finally{await session.endSession();}}
 listActors(){return this.actors.find({active:true}).sort({handle:1}).toArray();} findActor(id:string,session?:ClientSession){return this.actors.findOne({_id:id,active:true},{session});} findBoard(id:string,session?:ClientSession){return this.boards.findOne({_id:id},{session});}
 saveBoard(board:BoardDocument,session?:ClientSession){const{_id,...fields}=board;return this.boards.updateOne({_id},{$set:fields},{upsert:true,session});}
 listTasks(boardId:string,session?:ClientSession){return this.tasks.find({boardId},{session}).sort({updatedAt:-1,_id:1}).toArray();} findTask(id:string,session?:ClientSession){return this.tasks.findOne({_id:id},{session});} createTask(task:TaskDocument,session?:ClientSession){return this.tasks.insertOne(task,{session});}
 async updateTaskStatus(id:string,expectedStatus:string,statusId:string,updatedAt:Date,updatedBy:string,session?:ClientSession){const r=await this.tasks.updateOne({_id:id,statusId:expectedStatus},{$set:{statusId,updatedAt,updatedBy}},{session});return r.modifiedCount===1;}
 async updateTaskDetails(id:string,title:string,description:string,updatedAt:Date,updatedBy:string,session?:ClientSession){const r=await this.tasks.updateOne({_id:id},{$set:{title,description,updatedAt,updatedBy}},{session});return r.modifiedCount===1;}
 async deleteTask(id:string,session?:ClientSession){const r=await this.tasks.deleteOne({_id:id},{session});return r.deletedCount===1;} appendAuditEvent(event:AuditEventDocument,session?:ClientSession){return this.auditEvents.insertOne(event,{session});}
 listAuditEvents(taskId:string,session?:ClientSession){return this.auditEvents.find({taskId},{session}).sort({createdAt:1,_id:1}).toArray();} listAuditEventsForTasks(ids:string[]){return ids.length?this.auditEvents.find({taskId:{$in:ids}}).sort({createdAt:1,_id:1}).toArray():Promise.resolve([]);}
 async importTaskIfMissing(task:TaskDocument){const r=await this.tasks.updateOne({_id:task._id},{$setOnInsert:task},{upsert:true});return r.upsertedCount===1;} async importAuditEventIfMissing(event:AuditEventDocument){const r=await this.auditEvents.updateOne({_id:event._id},{$setOnInsert:event},{upsert:true});return r.upsertedCount===1;}
}
