import argparse
from random import sample 

def main():
    parser = argparse.ArgumentParser(description="""This script takes in a nexus trees file. It samples randomly from trees and outputs a file containing just those n trees""")

    parser.add_argument('-t','--trees' ,
                        help='The tree files.')
    parser.add_argument('-o','--output' ,
                        help='The tree files.')
    parser.add_argument('-n','--sample' ,type=int,default=1,
                        help='The number of trees to extract.')
    parser.add_argument('-b','--burnin' ,default = 100,type=int,
                        help='The number of trees to ignore at the start of the file.')   
    args=parser.parse_args()
    
    header = []
    trees=[]
    
    with open(args.trees,"r") as treeFile:
        stopAtNextSemiColon=False
        onToTrees=False
        treeCounter=0
        for line in treeFile:
            if not onToTrees:
                header.append(line)
                if stopAtNextSemiColon and ";" in line:
                    onToTrees=True
                elif "Begin trees;" in line:
                    stopAtNextSemiColon=True 

                
            else:
                treeCounter+=1
                if treeCounter>args.burnin and "tree" in line:
                    trees.append(line)
    choosenTrees=sample(trees,args.sample)

    finalFileLines=[]
    finalFileLines.extend(header)
    finalFileLines.extend(choosenTrees)
    finalFileLines.append("End;\n")

    with open(args.output,"w") as outfile:
        outfile.writelines(finalFileLines)


if __name__ == '__main__':
    main() 