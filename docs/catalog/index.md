# CATALOG

## Construction
To obtain the multi-band catalog for JWST-SPRING, we built a dedicated pipeline using tools such as 
[Gnuastro](https://www.gnu.org/software/gnuastro/) and 
[Photutils](https://photutils.readthedocs.io/en/stable/index.html). The specific processing steps are as follows:

1. Construct the stacked images for F277W, F356W, and F444W, and build masks for overexposed stars and persistence 
regions.
2. Use Gnuastro’s noisechisel for detection on both the F444W image and the stacked images.
3. Use the segmentation of the stacked image as a reference image to remove outliers from the F444W image segmentation 
detection.
4. Use Gnuastro’s astsegment for deblending on both the F444W image and the stacked image.
5. Query stars in each region using Gaia.query_object_async. For the F444W image in the corresponding regions, apply the 
deblending results from the stacked image to minimize over-deblending of stars.
6. Mask the detected regions in the F444W image segmentation using the overexposed star and persistence region mask 
images.
7. Manually inspect the F444W image segmentation, focusing mainly on checking for anomalies in the boundary regions.
8. Use Photutils to generate the final photometric catalog from the final F444W band segmentation image. (In the final 
output catalog, any objects with ISO or KRON photometry fluxes less than 0 in the F444W band will be discarded).

## Columns Name

The zero point for the following is 23.9.

`id`：The source ID (due to various processing steps in the star catalog generation — some sources were discarded, so 
the IDs are not continuous).

`xcentroid`：The x-coordinate of the centroid for each source (based on segmentation; not recommended for use, you can 
use xcentroid_win below).

`ycentroid`：The y-coordinate of the centroid for each source (based on segmentation; not recommended for use, you can 
use ycentroid_win below).

`ra`：The RA corresponding to xcentroid.

`dec`：The Dec corresponding to ycentroid.

`xcentroid_win`：Equivalent to SExtractor's XWIN_IMAGE.

`ycentroid_win`：Equivalent to SExtractor's YWIN_IMAGE.

`ra_win`：The RA corresponding to xcentroid_win.

`dec_win`：The Dec corresponding to ycentroid_win.

`segment_flux`：The ISO flux of the detection image (F444W).

`segment_fluxerr`：The ISO flux error of the detection image (F444W) based on the RMS image.

`segment_mag`：The ISO magnitude of the detection image (F444W).

`segment_magerr`：The ISO magnitude error of the detection image (F444W).

`f_FxxxW`：The total flux for each band (F444W band uses KRON flux, while other bands use ISO flux multiplied by a 
correction factor).

`e_FxxxW`：The total flux error for each band (based on the RMS image).

`background_sum`：The background sum for the source's corresponding segmentation (currently no additional background 
subtraction has been performed during photometry, so this value is not available).

`bbox_xmin，bbox_xmax，bbox_ymin，bbox_ymax`：The bounding box limits for the segmentation region of the source.

`cxx，cyy，cxy`：The elliptical parameters, equivalent to those in SExtractor.

`a_image`： Equivalent to SExtractor's A_IMAGE.

`b_image`：Equivalent to SExtractor's B_IMAGE.

`theta_image`：Equivalent to SExtractor's THETA_IMAGE.

`kron_radius`：Equivalent to SExtractor's KRON_RADIUS.

`fwhm`：The full width at half maximum.

`elongation`：The ratio of the semi-major axis to the semi-minor axis.

`ellipticity`：1-elongation。

`apcorr`：The flux correction factor, obtained by dividing the KRON flux in the F444W band by the ISO flux.
