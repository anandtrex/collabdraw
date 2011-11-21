find . -name \*.png | sed 's/png//g' | xargs -n 1 -I {} convert {}png {}jpg
ffmpeg -f image2 -i canvas%d.jpg test.webm