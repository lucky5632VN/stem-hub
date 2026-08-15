from PIL import Image
path = r'e:\project\lab_sinh\public\external\native\muscle-contraction\images\312_atlas_.png'
with Image.open(path) as img:
    print(img.size)
