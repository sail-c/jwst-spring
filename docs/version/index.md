# Version Information

## NIRCAM
**v1.0**：Similar to the [CEERS NIRCam pipeline](https://github.com/ceers/ceers-nircam), improve WCS calibration and background subtraction algorithms.

**v1.1**：Modify Modify the pipeline to move the WISP and 1/f processing steps to Stage 2, in order to insert the 
persistence masking process.

**v1.2**：Optimize the 1/f algorithm by setting the striping value to 0 when the mask exceeds 85% for any row or column. 
Also, optimize the outlier clipping algorithm.

**v1.3**：Construct a reference catalog using F814W and F160W, then create the F150W image. Next, use F150W and F160W to 
construct a reference catalog for processing NIRCAM data in other bands.

**v1.4**：Optimize the outlier clipping algorithm; build the first version of the reference catalog for UDS using 
UKIDSS, F814W, and F160W, with subsequent calibration processing methods identical to v1.3.

**v1.4.1**：Fix the WCS issue in COSMOS and UDS for F090W, F115W, and F200W.

**v1.5**：Introduce a [new WISP subtraction algorithm](https://dx.doi.org/10.1088/1538-3873/acea42) 
(currently not used for data), update the [WISP template](https://stsci.app.box.com/s/1bymvf1lkrqbdn9rnkluzqk30e8o2bne), 
optimize mask construction for 1/f removal and background processing, improve the outlier clipping algorithm, fix a bug 
in the read noise construction, and resolve background issues in the files before the final drizzle.

`v1.0：JWST Calibration pipeline v1.12.5； CRDS pmap 1179`

`v1.1：JWST Calibration pipeline v1.12.5； CRDS pmap 1179`

`v1.2：JWST Calibration pipeline v1.12.5； CRDS pmap 1183`

`v1.3：JWST Calibration pipeline v1.12.5； CRDS pmap 1185`

`v1.4：JWST Calibration pipeline v1.12.5； CRDS pmap 1185`

`v1.5：JWST Calibration pipeline v1.13.4； CRDS pmap 1236`


## MIRI
**v1.0**：Built based on the [CEERS MIRI](https://github.com/ceers/ceers-nircam) and our NIRCAM v1.1 pipeline.

**v1.1**：Fix bug where model.meta.wcs, model.meta.wcsinfo, and model.meta.cal_step.tweakreg were not updated after WCS 
calibration in the data model.

**v1.2**：Similar to NIRCAM v1.4, build the reference catalog using F444W and F160W for MIRI WCS calibration.

**v1.3**：Fix WCS calibration issues in the pipeline.

**v1.3.1**：Fix the WCS issue in COSMOS and UDS for F770W.

**v1.4**：Improve the flat image construction algorithm (for detection, dq, and error), and update the strategy to 
create a flat image every 6 months; add an outlier masking step.

`v1.0：JWST Calibration pipeline v1.12.5； CRDS pmap 1177`

`v1.1：JWST Calibration pipeline v1.12.5； CRDS pmap 1179`

`v1.2：JWST Calibration pipeline v1.12.5； CRDS pmap 1185`

`v1.3：JWST Calibration pipeline v1.12.5； CRDS pmap 1185`

`v1.4：JWST Calibration pipeline v1.13.4； CRDS pmap 1216`