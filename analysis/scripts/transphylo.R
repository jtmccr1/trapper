#!/usr/bin/env Rscript
suppressPackageStartupMessages(library('treeio'))
suppressPackageStartupMessages(library('TransPhylo'))
suppressPackageStartupMessages(library('tidyverse'))
suppressPackageStartupMessages(library('optparse'))
suppressPackageStartupMessages(library('jsonlite'))
suppressPackageStartupMessages(library('lubridate'))


####################################################


startNexus<-function(file,tree){
  string = "#NEXUS\n\nBegin taxa;\n\tDimensions ntax="
  string = paste0(string,length(tree$tip.label),";\n\tTaxlabels\n")
  for(i in 1:length(tree$tip.label)){
    string = paste0(string,"\t\t",tree$tip.label[i],"\n")
  }
  string=paste0(string,"\t\t;\nEND;\n\nBegin trees;\n\n\tTranslate\n")
  for(i in 1:(length(tree$tip.label)-1)){
    string = paste0(string,"\t\t",i," ",tree$tip.label[i],",\n")
  }
  lastTaxa<-length(tree$tip.label)
  string = paste0(string,"\t\t",lastTaxa," ",tree$tip.label[lastTaxa],"\n\t\t;")
  string=paste0(string,"\nEND;\n")
  cat(string,file=file)
}
#' This appends a tree to a nexus file
#' This assumes the taxa labels are already in the file. 
#' The last line of the file is assumed to be "END;". It is removed 
#' and "END;" is added after the tree.
#' 
#' @param file The tree file we are appending to
#' @param tree The phylo tree object
#' @param name The name of the tree file.
appendTree<-function(file,tree,name="unnamed"){
  fileString = readLines(file)
  fileString=fileString[-length(fileString)] # get rid of the last line "END;"

  treeString<- capture.output(write.beast(tree,tree.name=name)) 
  treeString<-treeString[length(treeString)-1]
  
  
  fileString[length(fileString)+1]=treeString
  fileString[length(fileString)+1]="END;"
  writeLines(fileString,file)
}
getPhyloParent<-function(child,phylo){
  if(length(which(phylo$edge[,2]==child))==0){
    return(NA)
  }
  phylo$edge[which(phylo$edge[,2]==child),1]
}


getTransPhyloParent<-function(child,ctree){
  parent<-which(ctree[,2]==child)
  if(length(parent)==1){
    #inserted degree 2 node
    if(ctree[parent,3]==0){
      getTransPhyloParent(parent,ctree)
    }
    return(parent)
  }else{
    parent<-which(ctree[,3]==child)
    if(length(parent)==1){
      return(parent)
    }else{
    # root
      return(NA)
    }
  }
}

  
getPhyloToCtreeMap<-function(tree,ctree){
  # I will traverse the tree starting a the tips. They match between phylo objects and transphylo trees.
  # We will work towards the root filling in  what is known as we go.
  # For each visited node,add it to a tibble that holds the phylo and ptree node index.
  # add parent to to visit array if it isn't already there, or hasn't been visitied
  #remove visited node from to visit add to visited array
  

  ntips<-length(tree$tip.label)
  nNodes<-tree$Nnode+ntips
  
  visited<-c()
  toVisit<-c(1:ntips)
  results<-tibble("phylo"=c(toVisit,rep(NA,tree$Nnode)),"transPhylo"=c(toVisit,rep(NA,tree$Nnode)))
  i<-ntips+1
  while(length(toVisit)>0){
    if(toVisit[1] %in% visited){
      toVisit<-toVisit[-1]
      next
    }
    currentPhyloNode<-toVisit[1]
    currentTransphyloNode<-results$transPhylo[which(results$phylo==currentPhyloNode)]
    
    phyloParent<-getPhyloParent(currentPhyloNode,tree)
    # check if we are at root or a sibling of a visited node
    if(is.na(phyloParent)| phyloParent %in% results$phylo){
      toVisit<-toVisit[-1]
      visited<-c(visited,currentPhyloNode)
      next
    }

    transPhyloParent<-getTransPhyloParent(currentTransphyloNode,ctree)
    
    toVisit<-c(toVisit[-1],phyloParent)
    visited<-c(visited,currentPhyloNode)
    
    results[i,]<-c(phyloParent,transPhyloParent)
    i=i+1
    
  }
  return(results)
}


getTransmissionTimes<-function(node,ctree){
  numbUnSampled<-length(unique(ctree$ctree[,4]))-length(ctree$nam)
  nam<-c(ctree$nam,paste0("UnSampled",1:numbUnSampled))
  ctree_mat<-ctree$ctree
  parent = ctree_mat[which(ctree_mat[,2]==node|ctree_mat[,3]==node),]
  if(length(parent)==0){
    return(NA)
  }
  parentIsInserted = parent[2]==0 | parent[3]==0 # only has 1 child
  # Is this inserted node in the same host as node i.e.is it the onset node of the one we're interested in?
  nodeHost=ctree_mat[node,4]
  parentHost=parent[4]
  nodeHeight<-ctree_mat[node,1]
  #The parent node is a bifurcation so there are no inserted cases
  #The NA happends when length of parent==0 but sometimes isn't caught above
  
  if(!parentIsInserted){
    return(NA)
    
  }else{
    transmissionTimes<-c()
    hosts<-c()
    
    while(!is.na(parentIsInserted)&&parentIsInserted){ # If we hit the root case parentisInserted is NA
      parentHeight<-parent[1]
      transmissionTimes<-c(transmissionTimes,(nodeHeight-parentHeight))
      hosts<-c(hosts,nam[parent[4]])
      node =  which(apply(ctree_mat, 1, function(x) identical(x, parent)))
      parent = ctree_mat[which(ctree_mat[,2]==node|ctree_mat[,3]==node),]
      parentIsInserted = parent[2]==0 | parent[3]==0
      
    }
    # The first inserted node represents transmission into this host There are n-1 inserted hosts
    #  if n =4
    #     c1      c2    c3
    # &--------&-------&-----&-------node
    result<-tibble("host"=hosts,height=transmissionTimes)
    return(result)
  }
}



annotateBeastTree<-function(beastTree,ctree){
  # for each node get host
  ctree_mat<-ctree$ctree
  ntips = length(beastTree@phylo$tip.label)
  # nam<-c(ctree$nam, rep("Unknown",nrow(ctree_mat)-length(ctree$nam)))
  numbUnSampled<-length(unique(ctree_mat[,4]))-length(ctree$nam)
  nam<-c(ctree$nam,paste0("UnSampled",1:numbUnSampled))
  # nam<-c(ctree$nam, length(ctree$nam):(nrow(ctree_mat)-length(ctree$nam)))
  
  tree_data<-beastTree@data
  if(nrow(tree_data)==0){
    tree_data<-as_tibble(list('node'=c(1:(ntips+beastTree@phylo$Nnode))))
  }
  # node is an integer stored as a character yuck!
  tree_data$node<-as.numeric(tree_data$node)
  # phylo objects order nodes 1-tips then internal nodes in preoder, transphylo orders internal nodes in post order
  # with the children visited in right left order
  # this corrects so the node number in phylo is coverted to the row of the ptree matrix borrow code from transphylo
  tra<-getPhyloToCtreeMap(beastTree@phylo,ctree_mat)
  #get hosts
  # needs to be the inverse or a loop so start with ptree row get host then convert to phylo node and input in the right spot
  tree_data<-tree_data%>%rowwise()%>%mutate(host = nam[ctree_mat[tra$transPhylo[tra$phylo==node],4]])
  # add node labels match ape numbering
  beastTree@phylo$node.label<-paste0("node",ntips:(ntips+beastTree@phylo$Nnode))
  
  transmissions<-list()
  ids<-c()
  for(i in 1:nrow(tree_data)){
    phyloNode<-tree_data$node[i]
    transmissions[[i]]<-getTransmissionTimes(tra$transPhylo[tra$phylo==phyloNode],ctree)

    if(phyloNode<=ntips){
      ids[i]<-beastTree@phylo$tip.label[phyloNode]
    }else{
      ids[i]<-beastTree@phylo$node.label[(phyloNode-ntips)]
    }
    
  }

  tree_data$transmissions<-transmissions
  tree_data$id<-ids


  # # get number of inserted cases before the next node
  annotatedTree<-treedata(phylo=as.phylo(beastTree@phylo),data=tree_data)
  return(annotatedTree)
}


getLink<-function(node,ctree){
  
  ttree<-extractTTree(ctree)
  ttree_mat<-ttree$ttree
  target<-ttree$nam[node]
  parentIndex<-ttree_mat[node,3]
  
  insertedCase<-0
  while(parentIndex>length(ttree$nam) & parentIndex>0){
    insertedCase=insertedCase+1
    node<-parentIndex
    parentIndex<-ttree_mat[node,3]
  }
  if(parentIndex==0){
    source<-"UnsampledrootCase"
  }else{
    source<-ttree$nam[parentIndex]
    
  }
  return(c(target,source,insertedCase))
}
#############################################

option_list <- list(
  make_option(c( "--tree"),
              help="The file holding the nexus tree."),
  make_option(c("--dateLastSample"),type="numeric",
              help = "The date the last sample was taken in year decimal format."),
  make_option(c("--shape"), type="numeric",
               help = "The shape parameter for the serial interval distribution."),
  make_option(c("--scale"), type="numeric",
               help = "The scale parameter for the serial interval distribution."),
  make_option(c("--MCMC"), type="numeric",
               help = "The size of the MCMC chain"),
  make_option(c("--thinning"), type="numeric",
               help = "The thining to be applied to the MCMC chain."),
  make_option(c("--samples"), type="numeric",
              help = "How many samples should we write to the output. Taken from the end of the chain."),
make_option(c("--beastTree"), action = "store_true",default="FALSE",
                        help = "Should annotated trees be written to a tree file. Default is 1 newick tree with annotations in json for each sample."),
  make_option(c("--file"),
               help = "The file root for logging the log and trees files")
)
opt <- parse_args(OptionParser(option_list=option_list))

# opt<-tibble::tibble(tree="../data/147_phylogeog.CA_MCC.tree",dateLastSample=2019.03,shape = 8.7,scale=0.0046,MCMC=10,thinning=1,file="test",samples=5,beastTree=F)

tree<-read.beast(opt$tree)
ptree<-ptreeFromPhylo(tree@phylo,dateLastSample=opt$dateLastSample)

cat("Inferring transmission tree\n",stdout())
record<-inferTTree(ptree = ptree,fileRoot=opt$file,mcmcIterations=opt$MCMC,thinning=opt$thinning,w.shape=opt$shape,w.scale=opt$scale,dateT=opt$dateLastSample,updateOff.p=TRUE)

save.image(paste0(opt$file,"_tempLog",".RData"))
# # samples for export;
totalRecords<-length(record)
firstSample<-totalRecords-(opt$samples-1)
sampledRecords<-record[firstSample:totalRecords]
taxa<-length(tree@phylo$tip.label)
# set up the link csv
links<-as_tibble(list("target"=rep(NA,taxa*length(sampledRecords)),"source"=rep(NA,taxa*length(sampledRecords)),"unknownIntermediates"=rep("NA",taxa*length(sampledRecords))))
infectionTimes<-as_tibble(list("id"=rep(NA,taxa*length(sampledRecords)),"rawSymptomOnset"=rep(NA,taxa*length(sampledRecords))))

k=1
treeFile<-paste0(opt$file,".trees")
if(opt$beastTree){
  startNexus(treeFile,tree@phylo)
}else{
  annotations<-list()
}
sample_int=1


for(sample in sampledRecords){
  # get links;
  ctree<-sample$ctree
  ttree = extractTTree(ctree)
  for(i in 1:length(ctree$nam)){
    links[k,]<-getLink(i,ctree)
    infectionTimes[k,]<-c(ttree$nam[i],date_decimal(ttree$ttree[i,1]))#as.character(date(date_decimal(ttree$ttree[i,1])))) # to avoid storing milliseconds 
    k=k+1
  }
  annotatedBeastTree<-annotateBeastTree(tree,ctree)
  
  if(opt$beastTree){
    appendTree(treeFile,annotatedBeastTree,name=paste0("STATE_",sample_int))
  }else{
    annotations[[sample_int]]<-annotatedBeastTree@data
  }
  
  sample_int=sample_int+1
}

# R mailing list 
#summarize symptom onset 
hpd<-function(x){
  #generate an hpd set of level 0.95, based
  #on a sample x from the posterior
  dx<-density(x)
  md<-dx$x[dx$y==max(dx$y)]
  px<-dx$y/sum(dx$y)
  pxs<--sort(-px)
  ct<-min(pxs[cumsum(pxs)< 0.95])
  list(hpdr=range(dx$x[px>=ct]),mode=md)
}

summarizedInfectionTimesList <- infectionTimes%>% split(.$id)%>%
  map(function(x) hpd(as.numeric(x$rawSymptomOnset))) %>% 
  map(function(x) list(mode = date(as.POSIXct(x$mode,origin=origin)), hpdr = date(as.POSIXct(x$hpdr,origin=origin))))#, symptomOnset_hpd = paste(hpd(as.numeric(rawSymptomOnset)),concat=","))
summarizedInfectionTimes<-tibble(id=names(summarizedInfectionTimesList),mode = map(summarizedInfectionTimesList,"mode"),hpd = map(summarizedInfectionTimesList,"hpdr"))
# as json
summarizedInfectionTimesJson<-toJSON(summarizedInfectionTimes)
cat(summarizedInfectionTimesJson,file=paste0(opt$file,"_lineLine",".json"))
# as csv
summarizedInfectionTimes<-summarizedInfectionTimes%>%rowwise()%>% mutate(mode = paste(mode,collapse = "_"), hpd = paste(hpd,collapse = "_"))

write_csv(links,paste0(opt$file,"_links",".csv"))
write_csv(summarizedInfectionTimes,paste0(opt$file,"_lineList",".csv"))
if(!opt$beastTree){
  annotationsJson<-toJSON(annotations)
  cat(annotationsJson,file=paste0(opt$file,".json"))
  #write newick tree with node labels
  write.tree(annotatedBeastTree@phylo,treeFile)
}






