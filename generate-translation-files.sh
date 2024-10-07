# generate all translation files via command line

# common
i18next \"$(grep -l "useTranslation()" -R src/* | tr '\n', ' ' | sed 's/.$//' | sed 's/ /" "/g')\" -o src/translation/en/common.json
