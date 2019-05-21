class Case{
    /** 
    * A class to hold data for each case. 'case' is a special word in javascript so we spell it with a k.
    * This class is intended to formalize the data format for each case. The constructor also takes a map which maps   * keys in the incoming object to those in the Case object. Required values in the map and their types are  
    *   symptomOnset     the date of first contact
    *   sampleDate       an array of dates
    *   resolution       The resolution of the case
    *   resolutionDate   The date of resolution
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
                  ['symptomOnset','symptomOnset'],
                  ['sampleDate','sampleDate'],
                  ['resolution','resolution'],
                  ['resolutionDate','resolutionDate'],
                  ['id','id'],
                  ['location','location'] 
                ]);
      }
    constructor(data,keyMap=new Map()){
      const dataMap = new Map([...Case.DEFAULT_MAP(),...keyMap])   
      
      this.symptomOnset = data[dataMap.get('symptomOnset')]? data[dataMap.get('symptomOnset')] :"Unknown";
      this.sampleDate = data[dataMap.get('sampleDate')]?data[dataMap.get('sampleDate')]:"Unknown";
      this.resolution = data[dataMap.get('resolution')]?data[dataMap.get('resolution')]:"Unknown";
      this.resoultionDate = data[dataMap.get('resolutionDate')]?data[dataMap.get('resolutionDate')]:"Unknown";
      this.id=data[dataMap.get('id')]?data[dataMap.get('id')]:"Unknown";
      this.location = data[dataMap.get('location')]?data[dataMap.get('location')]:"Unknown";
      this.caseId =  Symbol();
      
      this.metadata={};
      for(const key of Object.keys(data).filter(k=>[...dataMap.values()].indexOf(k)===-1)){ 
          
          this.metadata[key]=data[key];
       }
    }
    
    /**
    * Returns a copy of the date of symptomOnset
    */
    getSymptomOnset(){
     return new Date(this.symptomOnset.valueOf());
    }
    
     /**
    * Returns a copy of the sample dates 
    */
    getSampleDate(){
     return this.sampleDate.map(d=>new Date(d.valueOf()));
    }
    
     /**
    * Returns a copy of the date of symptomOnset
    */
    getResolution(){
     return this.resolution;
    }
    
    /**
    * Returns a copy of the resolution date
    */
    getResolutionDate(){
     return new Date(this.resolutionDate.valueOf());
    }
    /**
    * Returns a copy of the case id
    */
    getId(){
      return this.id;
    }
      /**
    * Returns a copy of the unique caseId
    */
    getCaseId(){
      return this.caseId;
    }
    
    /**
    * Returns a copy of the location
    */
    getLocation(){
      return this.location;
    }
    
  }
  export default Case;