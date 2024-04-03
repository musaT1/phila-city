/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Id64String } from "@itwin/core-bentley";
import { ContextRealityModel, ContextRealityModelProps, FeatureAppearance, ModelProps, ModelQueryParams, OrbitGtBlobProps, RealityDataFormat, RealityDataProvider, SpatialClassifier, SpatialClassifierFlags, SpatialClassifierInsideDisplay, SpatialClassifierOutsideDisplay } from "@itwin/core-common";
import { IModelApp, IModelConnection, ScreenViewport, SpatialModelState, SpatialViewState, Viewport } from "@itwin/core-frontend";
import { SelectOption } from "@itwin/itwinui-react";
import { RealityDataAccessClient, RealityDataResponse } from "@itwin/reality-data-client";

export default class RealityDataApi {
  public static async getRealityModels(imodel: IModelConnection): Promise<ContextRealityModelProps[]> {
    const RealityDataClient = new RealityDataAccessClient();
    const available: RealityDataResponse = await RealityDataClient.getRealityDatas(await IModelApp.authorizationClient!.getAccessToken(), imodel.iTwinId, undefined);
    const availableModels: ContextRealityModelProps[] = [];

    for (const rdEntry of available.realityDatas) {
      const name = undefined !== rdEntry.displayName ? rdEntry.displayName : rdEntry.id;
      const rdSourceKey = {
        provider: RealityDataProvider.ContextShare,
        format: rdEntry.type === "OPC" ? RealityDataFormat.OPC : RealityDataFormat.ThreeDTile,
        id: rdEntry.id,
      };
      const tilesetUrl = await IModelApp.realityDataAccess?.getRealityDataUrl(imodel.iTwinId, rdSourceKey.id);
      if (tilesetUrl) {
        const entry: ContextRealityModelProps = {
          classifiers: [],
          rdSourceKey,
          tilesetUrl,
          name,
          description: rdEntry?.description,
          realityDataId: rdSourceKey.id,
        };

        availableModels.push(entry);
      }
    }

    return availableModels;
  }


  public static toggleRealityModel(crmProp: ContextRealityModelProps, viewPort: ScreenViewport, show?: boolean) {
    const crmName = crmProp.name ? crmProp.name : "";


    if (show && !viewPort.displayStyle.hasAttachedRealityModel(crmName, crmProp.tilesetUrl)) {
      // Form orbitGtBlob object if reality data type is Point Cloud (orbitGTBlob is defined)
      let orbitGtBlob: OrbitGtBlobProps | undefined;
      if (crmProp.orbitGtBlob) {
        orbitGtBlob = {
          rdsUrl: crmProp.tilesetUrl,
          containerName: "",
          blobFileName: crmProp.orbitGtBlob.blobFileName,
          sasToken: "",
          accountName: crmProp.realityDataId ? crmProp.realityDataId : "",
        };
        crmProp.orbitGtBlob = orbitGtBlob;
      }
      viewPort.displayStyle.attachRealityModel(crmProp);

    } else if (!show) {
      viewPort.displayStyle.detachRealityModelByNameAndUrl(crmName, crmProp.tilesetUrl);
    }
    viewPort.invalidateScene();
  }



  // Modify reality data background transparency using the Viewport API
  public static setRealityDataTransparency(crmProp: ContextRealityModelProps, vp: ScreenViewport, transparency?: number) {
    if (transparency === undefined)
      transparency = 0;

    vp.displayStyle.settings.contextRealityModels.models.forEach((model) => {

      if (model.matchesNameAndUrl(crmProp.name!, crmProp.tilesetUrl))
        model.appearanceOverrides = model.appearanceOverrides ? model.appearanceOverrides.clone({ transparency }) : FeatureAppearance.fromJSON({ transparency });
    });


    return true;
  }

  public static async getAvailableClassifierListForViewport(vp?: Viewport): Promise<SelectOption<Id64String>[]> {
    const models: SelectOption<string>[] = [];
    if (!vp || !(vp.view instanceof SpatialViewState))
      return Promise.resolve(models);

    const modelQueryParams: ModelQueryParams = {
      from: SpatialModelState.classFullName,
      wantPrivate: false,
    };

    let curModelProps: ModelProps[] = new Array<ModelProps>();
    curModelProps = await vp.iModel.models.queryProps(modelQueryParams);

    // Filter out models that are not classifiers and form {[key: string]: string } object
    for (const modelProps of curModelProps) {
      if (modelProps.id && modelProps.name !== "PhiladelphiaClassification" && modelProps.name !== "Philadelphia_Pictometry") {
        const modelId = modelProps.id;
        const name = modelProps.name ? modelProps.name : modelId;
        models.push({ value: modelId, label: name.substring(0, name.indexOf(",")) });
      }
    }

    return Promise.resolve(models);
  }

  public static setRealityDataClassifier(vp: ScreenViewport, classifierId: string) {
    const realityModel: ContextRealityModel = vp.displayStyle.settings.contextRealityModels.models[0];

    const flags = new SpatialClassifierFlags(
      SpatialClassifierInsideDisplay.On,
      SpatialClassifierOutsideDisplay.Dimmed,
      false
    );

    const classifier: SpatialClassifier = new SpatialClassifier(
      classifierId,
      `${classifierId}`,
      flags,
      3.5
    );

    const existingClassifier = realityModel.classifiers?.findEquivalent(classifier);
    if (existingClassifier) {
      realityModel.classifiers?.replace(existingClassifier, classifier);
    } else {
      realityModel.classifiers?.add(classifier);
    }
  
    realityModel.classifiers?.setActive(classifier);
    vp.invalidateScene();
  }

}
