# Version Information

## NIRCAM
**v1.0**：与CEERS流水线类似，改善wcs定标和背景扣除算法。

**v1.1**：更改流水线扣除wisp和1/f处理过程位置，放在stage2阶段，为确保加入mask persistence过程。

**v1.2**：优化1/f算法，使得每行列mask超过0.85时该行striping的值为0，在官方去除outlier的过程中加入新的outlier扣除算法。

**v1.3**：使用F814W+F160W构建参考星表，得到总的F150W数据图像。之后，利用F150+F160W构建参考星表，用于处理NIRCAM其他波段数据。

**v1.4**：优化outlier剔除算法；uds利用ukidss构建第一版参考星表，之后定标处理方法与v1.3相同。

**v1.4.1**：修复COSMOS在F090W，F115W，F200W出现的wcs问题。

**v1.5**：新的wisp扣除算法（仅在wisp特别明显且wisp模板效果不佳时使用）；优化用于1/f removing的mask构建；优化用于背景处理的mask构建；优化
outlier clip 算法；修复构建read noise时的bug；修复用于最终drizzle前文件的背景问题。

`v1.0：JWST Calibration pipeline v1.12.5； CRDS pmap 1179`

`v1.1：JWST Calibration pipeline v1.12.5； CRDS pmap 1179`

`v1.2：JWST Calibration pipeline v1.12.5； CRDS pmap 1183`

`v1.3：JWST Calibration pipeline v1.12.5； CRDS pmap 1185`

`v1.4：JWST Calibration pipeline v1.12.5； CRDS pmap 1185`

`v1.5：JWST Calibration pipeline v1.13.4； CRDS pmap 1236`


## MIRI
**v1.0**：基于CEERS MIRI和我们的NIRCAM v1.1流水线构建。

**v1.1**：修复wcs定标后datamodel中model.meta.wcs，model.meta.wcsinfo和model.meta.cal_step.tweakreg未修改的bug。

**v1.2**：同NIRCAM v1.4，将重新构建F444W+F160W的参考星表用于定标。

**v1.3**：修复pipeline中关于wcs定标存在的问题。利用F444W+F160W作为参考星表。

**v1.3.1**：修复UDS在F770W中出现的wcs问题。

**v1.4**：改进制作平场算法（探测、dq和err）与策略（每6个月数据制作一幅平场数据），增加outlier mask步骤。

`v1.0：JWST Calibration pipeline v1.12.5； CRDS pmap 1177`

`v1.1：JWST Calibration pipeline v1.12.5； CRDS pmap 1179`

`v1.2：JWST Calibration pipeline v1.12.5； CRDS pmap 1185`

`v1.3：JWST Calibration pipeline v1.12.5； CRDS pmap 1185`

`v1.4：JWST Calibration pipeline v1.13.4； CRDS pmap 1216`