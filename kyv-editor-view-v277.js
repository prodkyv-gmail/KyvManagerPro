/* Studio Editor v2.77: memoized read-only visible rows, no DB writes or observers.
   Reuse results for progressive rendering; narrow on prefix search only when safe.
   Every read, table switch or successful inline edit invalidates the view. */
(function(root){'use strict';
  function create({normalize,parseSort}={}){
    if(typeof normalize!=='function'||typeof parseSort!=='function')throw new Error('Studio Editor view helpers missing');
    let data=[],revision=0,cache=null;
    function setRows(rows){data=Array.isArray(rows)?rows:[];revision++;cache=null;}
    function invalidate(){revision++;cache=null;}
    function select({query='',sortColumn=null,descending=false}={}){
      const text=normalize(query||''),column=sortColumn||null,desc=!!descending;
      if(cache&&cache.revision===revision&&cache.query===text&&cache.column===column&&cache.desc===desc)return cache.rows;
      const narrowing=cache&&cache.revision===revision&&cache.query&&text.startsWith(cache.query)
        &&cache.column===column&&cache.desc===desc;
      const candidates=narrowing?cache.rows:data;
      let rows=text
        ?candidates.filter(row=>Object.values(row).some(value=>value!==null&&normalize(String(value)).includes(text)))
        :data;
      if(column){
        rows=rows.map((row,index)=>({row,index})).sort((left,right)=>{
          const a=parseSort(left.row[column]),b=parseSort(right.row[column]);
          if(a.empty!==b.empty)return a.empty?1:-1;
          let comparison=0;
          if(a.type==='number'&&b.type==='number')comparison=a.value-b.value;
          else comparison=String(a.value).localeCompare(String(b.value),'it',{numeric:true,sensitivity:'base'});
          if(comparison===0)comparison=left.index-right.index;
          return desc?-comparison:comparison;
        }).map(item=>item.row);
      }
      cache={revision,query:text,column,desc,rows};
      return rows;
    }
    return Object.freeze({setRows,invalidate,select});
  }
  root.KYV_EDITOR_VIEW_V277=Object.freeze({create});
})(typeof window!=='undefined'?window:globalThis);
