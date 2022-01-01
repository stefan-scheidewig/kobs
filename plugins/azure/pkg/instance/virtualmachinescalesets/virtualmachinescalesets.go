package virtualmachinescalesets

import (
	"context"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore/arm"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/compute/armcompute"
)

// Client is the interface for a client to interact with the Azure virtual machien scale sets api.
type Client interface {
	ListVirtualMachineScaleSets(ctx context.Context, resourceGroup string) ([]*armcompute.VirtualMachineScaleSet, error)
	GetVirtualMachineScaleSet(ctx context.Context, resourceGroup, virtualMachineScaleSet string) (armcompute.VirtualMachineScaleSetsGetResponse, error)
	ListVirtualMachines(ctx context.Context, resourceGroup, virtualMachineScaleSet string) ([]*armcompute.VirtualMachineScaleSetVM, error)
}

type client struct {
	subscriptionID string
	vmssClient     *armcompute.VirtualMachineScaleSetsClient
	vmssVMsClient  *armcompute.VirtualMachineScaleSetVMsClient
}

// ListVirtualMachineScaleSets returns all virtual machine scale sets for the given resource group.
func (c *client) ListVirtualMachineScaleSets(ctx context.Context, resourceGroup string) ([]*armcompute.VirtualMachineScaleSet, error) {
	var vmsss []*armcompute.VirtualMachineScaleSet

	pager := c.vmssClient.List(resourceGroup, &armcompute.VirtualMachineScaleSetsListOptions{})
	if pager.Err() != nil {
		return nil, pager.Err()
	}

	for pager.NextPage(ctx) {
		vmsss = append(vmsss, pager.PageResponse().Value...)
	}

	return vmsss, nil
}

// GetVirtualMachineScaleSet returns a virtual machine scale set for the given resource group and virtual machine scale
// set name.
func (c *client) GetVirtualMachineScaleSet(ctx context.Context, resourceGroup, virtualMachineScaleSet string) (armcompute.VirtualMachineScaleSetsGetResponse, error) {
	return c.vmssClient.Get(ctx, resourceGroup, virtualMachineScaleSet, &armcompute.VirtualMachineScaleSetsGetOptions{})
}

// ListVirtualMachines returns all virtual machine scale sets for the given resource group and virtual machine scale
// set.
func (c *client) ListVirtualMachines(ctx context.Context, resourceGroup, virtualMachineScaleSet string) ([]*armcompute.VirtualMachineScaleSetVM, error) {
	var vmsss []*armcompute.VirtualMachineScaleSetVM

	pager := c.vmssVMsClient.List(resourceGroup, virtualMachineScaleSet, &armcompute.VirtualMachineScaleSetVMsListOptions{})
	if pager.Err() != nil {
		return nil, pager.Err()
	}

	for pager.NextPage(ctx) {
		vmsss = append(vmsss, pager.PageResponse().Value...)
	}

	return vmsss, nil
}

// New returns a new client to interact with the kubernetes services API.
func New(subscriptionID string, credentials *azidentity.ClientSecretCredential) Client {
	vmssClient := armcompute.NewVirtualMachineScaleSetsClient(subscriptionID, credentials, &arm.ClientOptions{})
	vmssVMsClient := armcompute.NewVirtualMachineScaleSetVMsClient(subscriptionID, credentials, &arm.ClientOptions{})

	return &client{
		subscriptionID: subscriptionID,
		vmssClient:     vmssClient,
		vmssVMsClient:  vmssVMsClient,
	}
}
