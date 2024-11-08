# CATALOG

## Construction
为了得到CANDELS的多波段星表，我构建了专门的pipeline，使用了gnuastro和photutils等工具，具体处理步骤如下：

1. 构建F277W、F356W、F444W叠加图像；构建过曝恒星和persistence区域mask。
2. 对F444W图像和叠加图像分别使用gnuastro的noisechisel进行探测。 
3. 以叠加图像的segmentation作为参考，去除F444W图像segmentation探测中的outlier。
4. 对F444W图像和叠加图像分别使用gnuastro的astsegment进行deblending。
5. 利用Gaia.query_object_async找到各个天区中的恒星，对于F444W图像相应区域的deblending，改用叠加图像的deblending结果，减轻恒星的over-deblending。
6. 利用过曝恒星和persistence区域的mask图像，mask在F444W图像segmentation中的探测。
7. 人工对F444W图像的segmentation进行最终检查，主要检查边界区域的异常探测。
8. 使用photutils结合最终的F444W波段segmentation图像构建最终的photometry星表（在最终的输出星表中，若F444W波段的ISO测光或KRON测光流量小于0，将会被丢弃）。

## Columns Name

以下所有流量的星等零点都为23.9

`id`：源的id号（由于在生成星表过程中的诸多处理——丢弃了一些源，id号是不连续的）。

`xcentroid`：每个源的x中心坐标（基于segmentation，不推荐使用，可以用下面的xcentroid_win）。

`ycentroid`：每个源的y中心坐标（基于segmentation，不推荐使用，可以用下面的ycentroid_win）。

`ra`：xcentroid对应的ra。

`dec`：ycentroid对应的dec。

`xcentroid_win`：同SExtractor的XWIN_IMAGE。

`ycentroid_win`：同SExtractor的YWIN_IMAGE。

`ra_win`：xcentroid_win对应的ra。

`dec_win`：ycentroid_win对应的dec。

`segment_flux`：探测图像（F444W）的ISO流量。

`segment_fluxerr`：探测图像（F444W）的ISO流量误差（基于RMS图像）。

`segment_mag`：探测图像（F444W）的ISO星等。

`segment_magerr`：探测图像（F444W）的ISO星等误差。

`f_FxxxW`：各个波段的总流量（F444W波段基于KRON流量，其他波段基于ISO流量乘以改正因子）。

`e_FxxxW`：各个波段的总流量误差（基于RMS图像）。

`background_sum`：源对应segmentation的背景值和（目前没有在测光中额外进行背景扣除，所以没有值）。

`bbox_xmin，bbox_xmax，bbox_ymin，bbox_ymax`：源对应segmentation区域的box范围。

`cxx，cyy，cxy`：同SExtractor的椭圆参数。

`a_image`：同SExractor的A_IMAGE。

`b_image`：同SExtractor的B_IMAGE。

`theta_image`：同SExtractor的THETA_IMAGE。

`kron_radius`：同SExtractor的KRON_RADIUS。

`fwhm`：半高全宽。

`elongation`：半主轴与半短轴之比。

`ellipticity`：1-elongation。

`apcorr`：流量改正因子，由F444W波段的KRON流量除以ISO流量得到。
