@echo off
set VER=1.5.14

sed -i -E "s/version>.+?</version>%VER%</" install.rdf
sed -i -E "s/version>.+?</version>%VER%</; s/download\/.+?\/active-stop-button-.+?\.xpi/download\/%VER%\/active-stop-button-%VER%\.xpi/" update.xml

set XPI=active-stop-button-%VER%.xpi
if exist %XPI% del %XPI%
zip -r9q %XPI% * -x .git/* .gitignore update.xml LICENSE README.md *.cmd *.xpi *.exe
