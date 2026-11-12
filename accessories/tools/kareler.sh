#!/bin/sh
# Videoyu kaydırma filmi karelerine çevirir.
# Kullanım: tools/kareler.sh video.mp4 bags        (kareler film/bags/f000.webp ... olarak yazılır)
#           tools/kareler.sh video.mp4 bags ters   (video bitmiş üründen geriye çekildiyse kare sırasını çevirir)
# Ürün adları: bags, canvas, leather, flexible, custom. Kare sayısı değişirse acc.js içindeki FILMS tablosunda n değerini güncelleyin.
set -e
in="$1"; ad="$2"; mkdir -p "film/$ad"
vf="fps=24,scale=1440:-2"; [ "$3" = "ters" ] && vf="reverse,$vf"
ffmpeg -y -i "$in" -vf "$vf" -c:v libwebp -quality 80 -start_number 0 "film/$ad/f%03d.webp"
echo "Son kare numarası: $(( $(ls film/$ad | wc -l) - 1 ))"
