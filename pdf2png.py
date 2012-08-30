#!/usr/bin/python

from subprocess import call
import os
from sys import argv
from glob import glob

if __name__ == "__main__":
    filePath = argv[1]
    fileDir = os.path.split(filePath)[0]
    for f in glob(fileDir+'/*.png'):
        os.remove(f)
        
    fileName = os.path.split(filePath)[1]
    print fileDir
    call(['./helpers/pdf-sam/bin/run-console.sh', '-f=' + filePath, '-o='+fileDir, '-s=BURST', 'split'])
    
    i = 1
    nextFile = str(i) + "_" + fileName 
    
    while os.path.exists(fileDir+'/'+nextFile):
        call(['convert', fileDir+'/'+nextFile, fileDir+'/'+str(i)+"_image.png"]) #nextFile.replace('pdf', 'png')
        os.remove(fileDir+'/'+nextFile)
        i += 1
        nextFile = str(i) + "_" + fileName
        
    print i - 1;
        
        
    
