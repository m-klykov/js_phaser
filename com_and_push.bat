@echo off
REM Запросить ввод текста для коммита
set /p commit_message=Imput commit mess: 

REM Добавление изменений
git add .

REM Создание коммита с введённым сообщением
git commit -m "%commit_message%"

REM Пуш изменений в удаленный репозиторий
git push origin master

REM Завершение работы
pause