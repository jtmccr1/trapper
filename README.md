# Trapper-prototype

to install
```
git clone https://github.com/jtmccr1/trapper.git

cd trapper

npm install
```
to run (in separate terminals)
```
node trapper.js DATA/FILES/DIRECTORY/
```



```
npm run start
```

To run the simulated examples you can (from the main directory) use

```
node trapper.js examples/simulated/
```

or visit a live version of the prototype here https://jtmccr1.github.io/trapper/.


## Data Files

Currently TRAPPER expects the DATA/FILES/DIRECTORY/ to have the following files:
```
lineList.csv - columns [id,symptomOnset,sampleDate,Outcome,Location] are expected if they are missing the data will be filled with "Unknown" any extra columns will be added to a metaData entry
links.csv - columns [target,source,dataSource] are expected if they are missing the data will be filled with "Unknown" any extra columns will be added to a metaData entry
tree.nwk -  the tree in newick format (branchlengths are assumed to be in years)
treeAnnotation.json - a json keyed by node ids
styles.css - any fills or styles that should be applied to the plots. Styles in trapper.css will take priority.
maps.json - a topoGeojson of the area of interest.
```
