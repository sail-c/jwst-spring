# Data Information

- *drz.fits drizzle后的科学图像

- *wht.fits drizzle后的权重图像

- *exp.fits drizzle后的曝光时间图像

- star_region_*.fits 包含过曝恒星和persistence的mask图像

- *segmentation.fits 对多波段叠加图像探测得到的segmentation图像

- *final_segmentation.fits 最终经过一系列处理（包含deblending，恒星和persistence mask，伪像去除等）得到的最终与测光星表对应的segmentation图像

- *photometry.txt 多波段测光星表

NIRCAM提供0.03''/pixel的图像，MIRI提供0.03''/pixel和0.09''/pixel的图像（在文件名中标识30mas和90mas）