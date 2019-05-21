class Link{
    /** 
    * A class to hold data for each link. 
    * This class is intended to formalize the data format for each case. The constructor also takes a map which maps   * keys in the incoming object to those in the Link object. Required values in the map and their types are  
    *   target           the id of the first contact
    *   source              the id of the source

    * Any incoming keys not mentioned in the dataMap are put in a metadata entry. If the required keys
    */
     /**
    * The constructor
    * @param data             an object with the following keys. Any other keys will be added to a metadata entry
    * @param keyMap          a map that maps incoming keys to the required entries above. The defualt assumes the    keys===the entry names. Any entries not provided will be taken from the defualt.
    *
    */
    
    static DEFAULT_MAP() {
          return new Map([
                  ['target','target'],
                  ['source','source'],
                  ['dataType','dataType'],
                ]);
      }
    constructor(data,keyMap=new Map()){
      const dataMap = new Map([...Link.DEFAULT_MAP(),...keyMap])   
      
      this.target = data[dataMap.get('target')]? data[dataMap.get('target')] :"Unknown";
      this.source = data[dataMap.get('source')]?data[dataMap.get('source')]:"Unknown";      
      this.dataType=data[dataMap.get('dataType')]?data[dataMap.get('dataType')]:"Unknown";
      this.metadata={};
      console.log(dataMap.values())
      for(const key of Object.keys(data).filter(k=>[...dataMap.values()].indexOf(k)===-1)){ 
          this.metadata[key]=data[key];
       }
    }
    
   
    
  }
  export default Link;