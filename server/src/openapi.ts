export const openApiDocument = {
 openapi:'3.1.0',
 info:{title:'Qonflo Mini Task Manager API',version:'1.1.0',description:'No authentication. Actor values are self-asserted attribution.'},
 servers:[{url:'http://localhost:3001'}],
 paths:{
  '/health':{get:{summary:'Health check',responses:{'200':{description:'OK'}}}},
  '/api/actors':{get:{summary:'List actors',responses:{'200':{description:'Actor list'}}}},
  '/api/board':{get:{summary:'Read shared board',responses:{'200':{description:'Board'}}}},
  '/api/board/columns':{post:{summary:'Add board column',requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['name'],properties:{name:{type:'string',maxLength:80}}}}}},responses:{'201':{description:'Updated board'},'422':{description:'Invalid or duplicate name'}}}},
  '/api/board/columns/order':{patch:{summary:'Reorder board columns',requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['columnIds'],properties:{columnIds:{type:'array',items:{type:'string'}}}}}}},responses:{'200':{description:'Updated board'},'422':{description:'Invalid complete column order'}}}},
  '/api/board/columns/{id}':{patch:{summary:'Rename column',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Updated board'}}},delete:{summary:'Delete empty column',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Updated board'},'422':{description:'Column in use or final column'}}}},
  '/api/tasks':{get:{summary:'List tasks',responses:{'200':{description:'Task list'}}},post:{summary:'Create task',requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['title'],properties:{title:{type:'string',maxLength:140},description:{type:'string',maxLength:2000}}}}}},responses:{'201':{description:'Task'}}}},
  '/api/tasks/{id}':{patch:{summary:'Edit task title and description',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['title','actor'],properties:{title:{type:'string'},description:{type:'string'},actor:{type:'string'}}}}}},responses:{'200':{description:'Task with audit event'}}},delete:{summary:'Delete task',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'204':{description:'Deleted'}}}},
  '/api/tasks/{id}/status':{patch:{summary:'Move task to any existing board column',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],requestBody:{required:true,content:{'application/json':{schema:{type:'object',required:['status','actor'],properties:{status:{type:'string'},actor:{type:'string'}}}}}},responses:{'200':{description:'Moved task'},'204':{description:'No-op'}}}},
  '/api/tasks/{id}/audit-logs':{get:{summary:'Immutable audit history',parameters:[{name:'id',in:'path',required:true,schema:{type:'string'}}],responses:{'200':{description:'Audit events oldest first'}}}}
 }
} as const;
