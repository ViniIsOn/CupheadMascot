from pathlib import Path, PurePosixPath
import runpy
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DESKTOP = ROOT / 'desktop'
BUNDLE = DESKTOP / 'pc_sources.zip'

if not BUNDLE.is_file():
    raise SystemExit(f'Pacote de fontes desktop não encontrado: {BUNDLE}')

with zipfile.ZipFile(BUNDLE) as archive:
    for info in archive.infolist():
        if info.is_dir():
            continue
        relative = PurePosixPath(info.filename)
        if relative.is_absolute() or '..' in relative.parts or not relative.parts:
            raise SystemExit(f'Caminho inválido no pacote desktop: {info.filename}')
        target = (ROOT.joinpath(*relative.parts)).resolve()
        if ROOT.resolve() not in target.parents:
            raise SystemExit(f'Arquivo fora do repositório: {info.filename}')
        target.parent.mkdir(parents=True, exist_ok=True)
        with archive.open(info, 'r') as source, target.open('wb') as destination:
            shutil.copyfileobj(source, destination)

base_script = DESKTOP / 'prepare_pc_base.py'
if not base_script.is_file():
    raise SystemExit('Preparador base do PC não foi extraído corretamente')
runpy.run_path(str(base_script), run_name='__main__')
