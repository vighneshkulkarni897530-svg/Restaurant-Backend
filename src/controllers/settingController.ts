import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getHotelSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.hotelSetting.findUnique({ where: { id: 'default' } });

    if (!settings) {
      settings = await prisma.hotelSetting.create({
        data: {
          id: 'default',
          hotelName: "Govinda's Restaurant & Dining",
          tagline: 'Authentic Pure Vegetarian Delicacies • QR Smart Table Service',
          currencySymbol: '₹',
          taxRatePercent: 5.0,
          serviceChargePercent: 2.5,
          wifiSsid: 'Govindas_Guest_WiFi',
          wifiPassword: 'WelcomeGovindas',
        },
      });
    }

    return res.status(200).json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve hotel settings', error: error.message });
  }
};

export const updateHotelSettings = async (req: Request, res: Response) => {
  try {
    const {
      hotelName,
      tagline,
      logoUrl,
      address,
      phone,
      email,
      currencySymbol,
      taxRatePercent,
      serviceChargePercent,
      wifiSsid,
      wifiPassword,
      enableOnlinePayment,
      enableCashPayment,
    } = req.body;

    const settings = await prisma.hotelSetting.upsert({
      where: { id: 'default' },
      update: {
        ...(hotelName && { hotelName }),
        ...(tagline !== undefined && { tagline }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(currencySymbol !== undefined && { currencySymbol }),
        ...(taxRatePercent !== undefined && { taxRatePercent: parseFloat(taxRatePercent) }),
        ...(serviceChargePercent !== undefined && { serviceChargePercent: parseFloat(serviceChargePercent) }),
        ...(wifiSsid !== undefined && { wifiSsid }),
        ...(wifiPassword !== undefined && { wifiPassword }),
        ...(enableOnlinePayment !== undefined && { enableOnlinePayment }),
        ...(enableCashPayment !== undefined && { enableCashPayment }),
      },
      create: {
        id: 'default',
        hotelName: hotelName || "Govinda's Restaurant & Dining",
        tagline: tagline || 'Authentic Pure Vegetarian Delicacies • QR Smart Table Service',
        logoUrl,
        address: address || 'Plot 108, Govinda Complex, Heritage Lane, Mumbai',
        phone: phone || '+91 98200 12345',
        email: email || 'dine@govindas.com',
        currencySymbol: currencySymbol || '₹',
        taxRatePercent: taxRatePercent ? parseFloat(taxRatePercent) : 5.0,
        serviceChargePercent: serviceChargePercent ? parseFloat(serviceChargePercent) : 2.5,
        wifiSsid: wifiSsid || 'Govindas_Guest_WiFi',
        wifiPassword: wifiPassword || 'WelcomeGovindas',
        enableOnlinePayment: enableOnlinePayment !== undefined ? enableOnlinePayment : true,
        enableCashPayment: enableCashPayment !== undefined ? enableCashPayment : true,
      },
    });

    return res.status(200).json({ success: true, message: 'Settings updated successfully', settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update settings', error: error.message });
  }
};
