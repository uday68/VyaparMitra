import { Resolver, Query, Mutation, Arg, ID } from 'type-graphql';
import { Vendor } from '../../db/mongo';
import { QRSessionService } from '../../services/qr_session';

@Resolver()
export class VendorResolver {
  @Query(() => [Vendor])
  async vendors(): Promise<any[]> {
    try {
      return await Vendor.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      throw new Error('Failed to fetch vendors');
    }
  }

  @Query(() => Vendor, { nullable: true })
  async vendor(@Arg('id', () => ID) id: string): Promise<any> {
    try {
      return await Vendor.findById(id);
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
      throw new Error('Vendor not found');
    }
  }

  @Mutation(() => Vendor)
  async createVendor(
    @Arg('name') name: string,
    @Arg('language') language: string,
    @Arg('location') location: string
  ): Promise<any> {
    try {
      // Generate QR code for vendor
      const qrCode = await QRSessionService.generateVendorQR();
      
      const vendor = new Vendor({
        name,
        language,
        location,
        qrCode,
      });

      await vendor.save();
      console.log(`✅ Vendor created: ${vendor.name}`);
      return vendor;
    } catch (error) {
      console.error('Failed to create vendor:', error);
      throw new Error('Failed to create vendor');
    }
  }

  @Mutation(() => Vendor)
  async updateVendor(
    @Arg('id', () => ID) id: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('language', { nullable: true }) language?: string,
    @Arg('location', { nullable: true }) location?: string
  ): Promise<any> {
    try {
      const updates: any = {};
      if (name) updates.name = name;
      if (language) updates.language = language;
      if (location) updates.location = location;

      const vendor = await Vendor.findByIdAndUpdate(id, updates, { new: true });
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      console.log(`✅ Vendor updated: ${id}`);
      return vendor;
    } catch (error) {
      console.error('Failed to update vendor:', error);
      throw new Error('Failed to update vendor');
    }
  }

  @Mutation(() => Boolean)
  async deleteVendor(@Arg('id', () => ID) id: string): Promise<boolean> {
    try {
      const result = await Vendor.findByIdAndDelete(id);
      if (!result) {
        throw new Error('Vendor not found');
      }

      console.log(`✅ Vendor deleted: ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      throw new Error('Failed to delete vendor');
    }
  }

  @Query(() => Vendor, { nullable: true })
  async vendorByQR(@Arg('qrCode') qrCode: string): Promise<any> {
    try {
      return await Vendor.findOne({ qrCode });
    } catch (error) {
      console.error('Failed to find vendor by QR:', error);
      return null;
    }
  }
}